"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type Rounded = "none" | "sm" | "md" | "lg" | "full";
type Fit = "cover" | "contain";
type AspectRatio = "square" | "video" | "portrait" | "auto";

type AppImageProps = Omit<ImageProps, "alt" | "src"> & {
    src: string;
    alt: string;
    fallbackSrc?: string;
    rounded?: Rounded;
    fit?: Fit;
    aspectRatio?: AspectRatio;
    containerClassName?: string;
};

const roundedMap: Record<Rounded, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
};

const ratioMap: Record<Exclude<AspectRatio, "auto">, string> ={
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
};

export function AppImage({
    src,
    alt,
    fallbackSrc = "/public/fallback.png",
    rounded = "md",
    fit = "cover",
    aspectRatio = "auto",
    className,
    containerClassName,
    fill,
    sizes,
    width,
    height,
    ...props
  }: AppImageProps) {
  
const [imgSrc, setImgSrc] = useState(src);
useEffect(() => setImgSrc(src), [src])
  
const ratioClass =
  aspectRatio !== "auto" && !fill ? ratioMap[aspectRatio] : undefined;
  
const image = (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        sizes={fill ? sizes ?? "100vw" : sizes}
        onError={() => {
          if (imgSrc !== fallbackSrc) setImgSrc(fallbackSrc);
        }}
        className={cn(
          roundedMap[rounded],
          fit === "cover" ? "object-cover" : "object-contain",
          className
        )}
    />
);
  
// if (fill) {  
//     return (
//       <div className={cn("relative overflow-hidden", roundedMap[rounded], containerClassName)}>
//         {image}
//       </div>
//     );
// }
  
if (ratioClass) {  
    return (
     <div className={cn("relative overflow-hidden", ratioClass, roundedMap[rounded], containerClassName)}>  
        <Image
            {...props}
            src={imgSrc}
            alt={alt}
            fill
            sizes={sizes ?? "100vw"}
            onError={() => {
              if (imgSrc !== fallbackSrc) setImgSrc(fallbackSrc);
            }}
            className={cn(
              roundedMap[rounded],
              fit === "cover" ? "object-cover" : "object-contain",
              className
            )}
        />
      </div>
    );
  }
  return image;
}