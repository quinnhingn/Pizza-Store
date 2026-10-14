import uvicorn
import os
import sys

def get_base_dir():
    """Lấy thư mục gốc - hoạt động cả khi chạy .py lẫn .exe"""
    if getattr(sys, 'frozen', False):
        # Đang chạy từ file .exe đã đóng gói bởi PyInstaller
        return os.path.dirname(sys.executable)
    else:
        # Đang chạy bình thường bằng Python
        return os.path.dirname(os.path.abspath(__file__))

if __name__ == "__main__":
    # Chuyển working directory về thư mục chứa .exe/.py
    base_dir = get_base_dir()
    os.chdir(base_dir)
    
    # Đảm bảo thư mục static tồn tại
    os.makedirs("static/uploads", exist_ok=True)
    
    # Import app SAU KHI đã chdir (để load_dotenv() tìm đúng .env)
    from app.main import app
    
    print(f"🍕 Pizza Store Server starting...")
    print(f"📁 Working directory: {base_dir}")
    print(f"🌐 Server: http://localhost:8000")
    print(f"📖 API Docs: http://localhost:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
