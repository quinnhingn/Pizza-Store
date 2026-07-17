-- ============================================================
-- PIZZA STORE DATABASE SCHEMA
-- PostgreSQL (Neon) - Ordered by Foreign Key Dependencies
-- ============================================================

-- ------------------------------------------------------------
-- 1. users
-- ------------------------------------------------------------
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(20) DEFAULT 'customer',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. user_addresses
-- ------------------------------------------------------------
CREATE TABLE user_addresses (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    address_line    VARCHAR(255) NOT NULL,
    province        VARCHAR(50) NOT NULL,
    district        VARCHAR(50),
    ward            VARCHAR(50),
    is_default      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. categories
-- ------------------------------------------------------------
CREATE TABLE categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) UNIQUE NOT NULL,
    description     TEXT,
    icon            VARCHAR(255),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. products
-- ------------------------------------------------------------
CREATE TABLE products (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2) NOT NULL,
    image_url       VARCHAR(500),
    category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_available    BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 5. toppings (Master catalog for toppings)
-- ------------------------------------------------------------
CREATE TABLE toppings (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100) UNIQUE NOT NULL,
    default_extra_price DECIMAL(10,2) DEFAULT 0
);

-- ------------------------------------------------------------
-- 6. product_toppings
-- ------------------------------------------------------------
CREATE TABLE product_toppings (
    id              SERIAL PRIMARY KEY,
    product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    topping_name    VARCHAR(100) NOT NULL,
    extra_price     DECIMAL(10,2) DEFAULT 0
);

-- ------------------------------------------------------------
-- 7. sizes (Master catalog for sizes)
-- ------------------------------------------------------------
CREATE TABLE sizes (
    id                          SERIAL PRIMARY KEY,
    name                        VARCHAR(50) UNIQUE NOT NULL,
    default_price_multiplier    DECIMAL(3,2) DEFAULT 1.0,
    default_extra_price         DECIMAL(10,2) DEFAULT 0
);

-- ------------------------------------------------------------
-- 8. product_sizes
-- ------------------------------------------------------------
CREATE TABLE product_sizes (
    id                  SERIAL PRIMARY KEY,
    product_id          INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_name           VARCHAR(20) NOT NULL,
    price_multiplier    DECIMAL(3,2) DEFAULT 1.0,
    extra_price         DECIMAL(10,2) DEFAULT 0
);

-- ------------------------------------------------------------
-- 9. ingredients
-- ------------------------------------------------------------
CREATE TABLE ingredients (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) UNIQUE NOT NULL
);

-- ------------------------------------------------------------
-- 8. product_ingredients
-- ------------------------------------------------------------
CREATE TABLE product_ingredients (
    id              SERIAL PRIMARY KEY,
    product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id   INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 9. vouchers
-- ------------------------------------------------------------
CREATE TABLE vouchers (
    id                  SERIAL PRIMARY KEY,
    code                VARCHAR(50) UNIQUE NOT NULL,
    discount_percent    INTEGER,
    discount_amount     DECIMAL(10,2),
    max_discount        DECIMAL(10,2),
    min_order_value     DECIMAL(10,2),
    start_date          TIMESTAMP NOT NULL,
    end_date            TIMESTAMP NOT NULL,
    usage_limit         INTEGER,
    used_count          INTEGER DEFAULT 0,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 10. orders
-- ------------------------------------------------------------
CREATE TABLE orders (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_code          VARCHAR(50) UNIQUE NOT NULL,
    total_amount        DECIMAL(10,2) NOT NULL,
    discount_amount     DECIMAL(10,2) DEFAULT 0,
    voucher_code        VARCHAR(50) REFERENCES vouchers(code) ON DELETE SET NULL,
    status              VARCHAR(30) DEFAULT 'pending',
    shipping_full_name  VARCHAR(100) NOT NULL,
    shipping_address    TEXT NOT NULL,
    shipping_phone      VARCHAR(20) NOT NULL,
    shipping_address_id INTEGER REFERENCES user_addresses(id) ON DELETE SET NULL,
    note                TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 11. order_items
-- ------------------------------------------------------------
CREATE TABLE order_items (
    id              SERIAL PRIMARY KEY,
    order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity        INTEGER NOT NULL,
    size_name       VARCHAR(20),
    unit_price      DECIMAL(10,2) NOT NULL,
    toppings        JSONB
);

-- ------------------------------------------------------------
-- 12. reviews
-- ------------------------------------------------------------
CREATE TABLE reviews (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_id        INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    is_approved     BOOLEAN DEFAULT FALSE,
    admin_reply     TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 13. banners
-- ------------------------------------------------------------
CREATE TABLE banners (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(200),
    image_url       VARCHAR(500) NOT NULL,
    link_url        VARCHAR(500),
    position        VARCHAR(30) DEFAULT 'home',
    order_index     INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    start_date      TIMESTAMP,
    end_date        TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 14. chat_history
-- ------------------------------------------------------------
CREATE TABLE chat_history (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id      VARCHAR(100),
    question        TEXT NOT NULL,
    answer          TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 15. carts
-- ------------------------------------------------------------
CREATE TABLE carts (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 16. cart_items
-- ------------------------------------------------------------
CREATE TABLE cart_items (
    id              SERIAL PRIMARY KEY,
    cart_id         INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL,
    size_name       VARCHAR(20),
    toppings        JSONB,
    added_at        TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);