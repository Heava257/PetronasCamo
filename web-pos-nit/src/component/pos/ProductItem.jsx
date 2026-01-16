import { Button, Image } from "antd";
import React from "react";
import { Config } from "../../util/config";
import { MdAddCircle } from "react-icons/md";

function ProductItem({
  name,
  description,
  category_name,
  brand,
  discount,
  barcode,
  price,
  image,
  handleAdd,
}) {
  var final_price = price;
  if (discount != 0 && discount != null) {
    final_price = price - (price * discount) / 100;
    final_price = final_price.toFixed(2);
  }

  return (
    <div className="
      w-full
      bg-white dark:bg-slate-800
      rounded-xl
      shadow-md dark:shadow-slate-900/50
      hover:shadow-xl dark:hover:shadow-slate-900/70
      transition-all
      duration-300
      overflow-hidden
      border border-gray-100 dark:border-slate-700
      flex flex-col
      h-full
    ">
      {/* Image Container */}
      <div className="
        relative
        w-full
        aspect-square
        bg-gray-50 dark:bg-slate-700
        overflow-hidden
      ">
        <Image
          src={Config.image_path + image}
          alt={name}
          className="w-full h-full object-cover"
          preview={{
            mask: (
              <div className="flex items-center justify-center text-white text-sm">
                Click to preview
              </div>
            )
          }}
        />
        
        {/* Discount Badge */}
        {discount != 0 && discount != null && (
          <div className="
            absolute
            top-2 right-2
            bg-red-500 dark:bg-red-600
            text-white
            px-3 py-1
            rounded-full
            text-xs font-bold
            shadow-lg
            animate-pulse
          ">
            -{discount}%
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        {/* Product Name */}
        <h3 className="
          text-base sm:text-lg
          font-semibold
          text-gray-800 dark:text-gray-100
          mb-2
          line-clamp-2
          min-h-[2.5rem]
        ">
          {name}
        </h3>

        {/* Product Details */}
        <div className="
          flex flex-wrap gap-1 sm:gap-2
          mb-2
          text-xs
        ">
          {barcode && (
            <span className="
              px-2 py-1
              bg-blue-50 dark:bg-blue-900/30
              text-blue-600 dark:text-blue-400
              rounded-md
              font-medium
            ">
              {barcode}
            </span>
          )}
          {category_name && (
            <span className="
              px-2 py-1
              bg-green-50 dark:bg-green-900/30
              text-green-600 dark:text-green-400
              rounded-md
              font-medium
            ">
              {category_name}
            </span>
          )}
          {brand && (
            <span className="
              px-2 py-1
              bg-purple-50 dark:bg-purple-900/30
              text-purple-600 dark:text-purple-400
              rounded-md
              font-medium
            ">
              {brand}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="
            text-xs sm:text-sm
            text-gray-600 dark:text-gray-400
            mb-3
            line-clamp-2
            flex-grow
          ">
            {description}
          </p>
        )}

        {/* Price Section */}
        <div className="mt-auto">
          {discount != 0 && discount != null ? (
            <div className="
              flex items-center gap-2 sm:gap-3
              mb-3
              flex-wrap
            ">
              {/* Original Price */}
              <span className="
                text-sm sm:text-base
                text-gray-400 dark:text-gray-500
                line-through
              ">
                ${price}
              </span>
              
              {/* Final Price */}
              <span className="
                text-xl sm:text-2xl
                font-bold
                text-green-600 dark:text-green-400
              ">
                ${final_price}
              </span>
              
              {/* Savings */}
              <span className="
                text-xs
                text-red-500 dark:text-red-400
                font-medium
              ">
                Save ${(price - final_price).toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="mb-3">
              <span className="
                text-xl sm:text-2xl
                font-bold
                text-gray-800 dark:text-gray-100
              ">
                ${price}
              </span>
            </div>
          )}

          {/* Add Button */}
          <Button
            onClick={handleAdd}
            type="primary"
            icon={<MdAddCircle className="text-lg" />}
            size="large"
            className="
              w-full
              h-10 sm:h-12
              text-sm sm:text-base
              font-semibold
              rounded-lg
              flex items-center justify-center gap-2
              bg-gradient-to-r from-blue-500 to-blue-600
              hover:from-blue-600 hover:to-blue-700
              dark:from-blue-600 dark:to-blue-700
              dark:hover:from-blue-700 dark:hover:to-blue-800
              border-none
              shadow-md hover:shadow-lg
              transition-all duration-200
            "
          >
            <span className="hidden sm:inline">Add to Cart</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProductItem;