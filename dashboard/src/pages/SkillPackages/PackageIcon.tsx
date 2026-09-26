import type { CSSProperties } from "react";
import { iconForName } from "../Experts/components/iconForName";

export function PackageIcon({
  iconUrl,
  iconName,
  size = 22,
  className,
  imageClassName,
  imageStyle,
}: {
  iconUrl?: string;
  iconName?: string;
  size?: number;
  className?: string;
  imageClassName?: string;
  imageStyle?: CSSProperties;
}) {
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        className={imageClassName ?? className}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: "cover",
          borderRadius: "inherit",
          ...imageStyle,
        }}
      />
    );
  }
  return iconForName(iconName, size);
}
