import os
import json
import google.generativeai as genai
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

# Đọc API key của Gemini từ biến môi trường và khởi tạo client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class ChatIntent(BaseModel):
    """Schema cấu trúc phản hồi JSON từ Gemini AI."""
    reply_message: str
    max_price: Optional[int] = None
    min_price: Optional[int] = None
    excluded_ingredients: Optional[List[str]] = None
    included_ingredients: Optional[List[str]] = None
    category_keyword: Optional[str] = None
    suggested_queries: Optional[List[str]] = None

# Schema dạng dict thuần (không dùng Pydantic class) để tránh lỗi "Unknown field: default"
# với google-generativeai SDK phiên bản cũ không hỗ trợ field "default" trong JSON Schema
CHAT_INTENT_SCHEMA = {
    "type": "object",
    "properties": {
        "reply_message": {"type": "string"},
        "max_price": {"type": "integer", "nullable": True},
        "min_price": {"type": "integer", "nullable": True},
        "excluded_ingredients": {
            "type": "array",
            "items": {"type": "string"},
            "nullable": True
        },
        "included_ingredients": {
            "type": "array",
            "items": {"type": "string"},
            "nullable": True
        },
        "category_keyword": {"type": "string", "nullable": True},
        "suggested_queries": {
            "type": "array",
            "items": {"type": "string"},
            "nullable": True
        }
    },
    "required": ["reply_message"]
}

# System prompt định hướng hành vi của chatbot AI
SYSTEM_PROMPT = """
Bạn là một trợ lý ảo thân thiện, nhiệt tình và chuyên nghiệp của cửa hàng Pizza Store.
Nhiệm vụ của bạn là tư vấn cho khách hàng về các món ăn dựa trên câu hỏi của họ.
Bạn phải ĐỌC và HIỂU yêu cầu của khách hàng để trích xuất các điều kiện lọc (filters) tương ứng.

DANH MỤC SẢN PHẨM HIỆN CÓ TRONG CỬA HÀNG (category_keyword phải khớp chính xác):
- "Pizza" — Các loại bánh pizza
- "Gà rán" — Gà rán, cánh gà
- "Đồ uống" — Nước ngọt, trà, cà phê
- "Mì Ý" — Spaghetti, pasta
- "Món Khai vị" — Bánh mì bơ tỏi, khoai tây chiên, v.v.

CÁC QUY TẮC TRÍCH XUẤT (FILTERS):
- max_price: Số tiền tối đa (ví dụ: "dưới 200k" -> 200000, "rẻ" -> 100000, "bình dân" -> 150000). Đơn vị tiền tệ luôn là VNĐ.
- min_price: Số tiền tối thiểu (ví dụ: "trên 100k" -> 100000, "cao cấp/premium" -> 200000).
- excluded_ingredients: Danh sách nguyên liệu khách KHÔNG muốn ăn. Trích xuất từ các cụm: "không ăn X", "dị ứng X", "bỏ X", "không có X", "không thích X". Ví dụ: "Dị ứng hải sản" -> ["tôm", "mực", "cá"]. "Không ăn cay" -> ["ớt", "sốt cay"]. "Ăn chay" -> ["thịt bò", "thịt gà", "xúc xích", "tôm", "mực", "cá", "gà"].
- included_ingredients: Danh sách nguyên liệu khách MUỐN có. Trích xuất từ "có X", "thích X", "nhiều X". Ví dụ: "Thích phô mai" -> ["phô mai"]. "Nhiều thịt" -> ["thịt bò", "xúc xích", "gà"].
- category_keyword: Tên danh mục chính xác từ danh sách trên. Ví dụ: "pizza" -> "Pizza", "nước uống/thức uống/đồ uống" -> "Đồ uống", "gà/gà rán" -> "Gà rán", "mì/pasta/spaghetti" -> "Mì Ý", "khai vị/appetizer" -> "Món Khai vị". Nếu không rõ danh mục, để null.
- suggested_queries: 2-3 câu gợi ý tiếp theo tự nhiên, đa dạng, liên quan tới câu hỏi trước.

QUY TẮC TRẢ LỜI (reply_message):
- Trả lời bằng tiếng Việt, xưng hô lịch sự (dạ, vâng, ạ). Xưng "em", gọi khách "anh/chị".
- Xác nhận lại yêu cầu của khách một cách tự nhiên.
- KHÔNG tự bịa tên sản phẩm hoặc giá cả. Hệ thống sẽ tự động hiển thị danh sách sản phẩm phù hợp bên dưới.
- Nếu khách chỉ chào hỏi, hãy chào lại và giới thiệu ngắn gọn cửa hàng (đa dạng menu, có pizza, mì ý, gà rán, khai vị, đồ uống).
- Nếu khách hỏi về khuyến mãi/voucher, trả lời rằng hãy kiểm tra mục "Ưu đãi" trên website.
- Nếu khách hỏi ngoài phạm vi (thời tiết, tin tức...), nhẹ nhàng dẫn dắt quay về menu.

QUAN TRỌNG:
- Câu trả lời ngắn gọn (1-3 câu), tự nhiên, không lặp lại.
- Khi khách yêu cầu phức tạp (ví dụ: "gợi ý combo cho 4 người"), hãy trích xuất filter hợp lý nhất và trả lời tư vấn.
"""

def get_chat_intent_sync(user_message: str, history: list = None) -> dict:
    """
    Gọi Gemini AI để phân tích ý định (intent) của người dùng (phiên bản đồng bộ).
    Dùng trong các context không hỗ trợ async.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured in .env")

    model = genai.GenerativeModel(
        model_name="gemini-flash-latest",
        system_instruction=SYSTEM_PROMPT,
    )
    
    # Cấu hình bắt buộc trả về JSON theo schema ChatIntent
    generation_config = genai.GenerationConfig(
        response_mime_type="application/json",
        response_schema=CHAT_INTENT_SCHEMA,
    )
    
    # Xây dựng ngữ cảnh từ lịch sử hội thoại để AI hiểu context
    full_prompt = user_message
    if history:
        context_lines = ["[Lịch sử hội thoại gần đây để tham khảo ngữ cảnh]"]
        for msg in history:
            role = msg.get("role", "user")
            text = msg.get("text", "")
            if text:
                label = "Khách" if role == "user" else "Bot"
                context_lines.append(f"{label}: {text}")
        context_lines.append("[Kết thúc lịch sử. Hãy trả lời câu hỏi mới nhất dưới đây, kết hợp với ngữ cảnh ở trên nếu cần]")
        context_lines.append(f"Khách: {user_message}")
        full_prompt = "\n".join(context_lines)
    
    response = model.generate_content(
        full_prompt,
        generation_config=generation_config,
    )
    
    return json.loads(response.text)

async def get_chat_intent(user_message: str, history: list = None) -> dict:
    """
    Gọi Gemini AI để phân tích ý định (intent) của người dùng (phiên bản bất đồng bộ).
    Dùng trong các API endpoint async của FastAPI.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured in .env")

    model = genai.GenerativeModel(
        model_name="gemini-flash-latest",
        system_instruction=SYSTEM_PROMPT,
    )
    
    # Cấu hình bắt buộc trả về JSON theo schema ChatIntent
    generation_config = genai.GenerationConfig(
        response_mime_type="application/json",
        response_schema=CHAT_INTENT_SCHEMA,
    )
    
    
    # Xây dựng ngữ cảnh từ lịch sử hội thoại để AI hiểu context
    full_prompt = user_message
    if history:
        context_lines = ["[Lịch sử hội thoại gần đây để tham khảo ngữ cảnh]"]
        for msg in history:
            role = msg.get("role", "user")
            text = msg.get("text", "")
            if text:
                label = "Khách" if role == "user" else "Bot"
                context_lines.append(f"{label}: {text}")
        context_lines.append("[Kết thúc lịch sử. Hãy trả lời câu hỏi mới nhất dưới đây, kết hợp với ngữ cảnh ở trên nếu cần]")
        context_lines.append(f"Khách: {user_message}")
        full_prompt = "\n".join(context_lines)
    
    # Gọi API Gemini dạng async để không block event loop
    response = await model.generate_content_async(
        full_prompt,
        generation_config=generation_config,
    )
    
    return json.loads(response.text)
