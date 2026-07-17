from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)

    product_associations = relationship("ProductIngredient", back_populates="ingredient", cascade="all, delete-orphan")


class ProductIngredient(Base):
    __tablename__ = "product_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False, index=True)

    product = relationship("Product", back_populates="ingredient_associations")
    ingredient = relationship("Ingredient", back_populates="product_associations", lazy="joined")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    image_url = Column(String(500), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    is_available = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    category = relationship("Category", back_populates="products")
    ingredient_associations = relationship("ProductIngredient", back_populates="product", cascade="all, delete-orphan", lazy="selectin")
    size_associations = relationship("ProductSize", back_populates="product", cascade="all, delete-orphan", lazy="selectin")
    topping_associations = relationship("ProductTopping", back_populates="product", cascade="all, delete-orphan", lazy="selectin")

    @property
    def ingredients(self) -> list[str]:
        """Return list of ingredient names from associations."""
        return [assoc.ingredient.name for assoc in self.ingredient_associations if assoc.ingredient]

    @property
    def sizes(self):
        """Return list of ProductSize associations."""
        return self.size_associations

    @property
    def toppings(self):
        """Return list of ProductTopping associations."""
        return self.topping_associations


class Size(Base):
    __tablename__ = "sizes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    default_price_multiplier = Column(Numeric(3, 2), default=1.0)
    default_extra_price = Column(Numeric(10, 2), default=0)


class Topping(Base):
    __tablename__ = "toppings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    default_extra_price = Column(Numeric(10, 2), default=0)


class ProductSize(Base):
    __tablename__ = "product_sizes"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    size_name = Column(String(20), nullable=False)
    price_multiplier = Column(Numeric(3, 2), default=1.0)
    extra_price = Column(Numeric(10, 2), default=0)

    product = relationship("Product", back_populates="size_associations")


class ProductTopping(Base):
    __tablename__ = "product_toppings"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    topping_name = Column(String(100), nullable=False)
    extra_price = Column(Numeric(10, 2), default=0)

    product = relationship("Product", back_populates="topping_associations")
