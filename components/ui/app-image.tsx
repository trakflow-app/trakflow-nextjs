'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type Rounded = 'none' | 'sm' | 'md' | 'lg' | 'full';
type Fit = 'cover' | 'contain';
type AspectRatio = 'square' | 'video' | 'portrait' | 'auto';
type FixedImageDimension = NonNullable<ImageProps['width']>;

type BaseAppImageProps = Omit<
  ImageProps,
  'alt' | 'src' | 'fill' | 'width' | 'height' | 'onError'
> & {
  src: string;
  alt: string;
  fallbackSrc?: string;
  rounded?: Rounded;
  fit?: Fit;
  containerClassName?: string;
  onError?: ImageProps['onError'];
};

type FillAppImageWithRatioProps = BaseAppImageProps & {
  fill: true;
  aspectRatio: Exclude<AspectRatio, 'auto'>;
  width?: never;
  height?: never;
};

type FillAppImageWithContainerProps = BaseAppImageProps & {
  fill: true;
  aspectRatio?: 'auto';
  containerClassName: string;
  width?: never;
  height?: never;
};

type RatioAppImageProps = BaseAppImageProps & {
  fill?: false;
  aspectRatio: Exclude<AspectRatio, 'auto'>;
  width?: never;
  height?: never;
};

type FixedAppImageProps = BaseAppImageProps & {
  fill?: false;
  aspectRatio?: 'auto';
  width: FixedImageDimension;
  height: FixedImageDimension;
};

type AppImageProps =
  | FillAppImageWithRatioProps
  | FillAppImageWithContainerProps
  | RatioAppImageProps
  | FixedAppImageProps;

//In Next.js, files inside public/ are referenced from the site root
const DEFAULT_FALLBACK_SRC = '/trakflow-logo.png';
const DEFAULT_FILL_SIZES = '100vw';

const roundedMap: Record<Rounded, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

const ratioMap: Record<Exclude<AspectRatio, 'auto'>, string> = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
};

/**
 * Renders a Next.js image with fallback, rounded corners, fit, and aspect ratio handling.
 */
export default function AppImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  rounded = 'md',
  fit = 'cover',
  aspectRatio = 'auto',
  className,
  containerClassName,
  fill,
  sizes,
  width,
  height,
  onError,
  ...props
}: AppImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  const isFillImage = fill === true;
  const ratioClass = aspectRatio !== 'auto' ? ratioMap[aspectRatio] : undefined;
  const wrapperClassName = cn(
    'relative overflow-hidden',
    ratioClass,
    roundedMap[rounded],
    containerClassName,
  );
  const imageClassName = cn(
    roundedMap[rounded],
    fit === 'cover' ? 'object-cover' : 'object-contain',
    className,
  );

  const handleImageError: ImageProps['onError'] = (event) => {
    onError?.(event);

    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  if (isFillImage || ratioClass) {
    return (
      <div className={wrapperClassName}>
        <Image
          {...props}
          src={imgSrc}
          alt={alt}
          fill
          sizes={sizes ?? DEFAULT_FILL_SIZES}
          onError={handleImageError}
          className={imageClassName}
        />
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      onError={handleImageError}
      className={imageClassName}
    />
  );
}
