// Design System - EntityAvatar Component
// FINQZ PRO - Avatar para diferentes entidades

import React from "react";
import { User, Building2, Store, Briefcase, Shield } from "lucide-react";

export type EntityType = "user" | "cliente" | "parceiro" | "empresa" | "sistema";
export type EntitySize = "sm" | "md" | "lg";

export interface EntityAvatarProps {
  name: string;
  type?: EntityType;
  size?: EntitySize;
  imageUrl?: string;
  className?: string;
}

const sizeConfig: Record<EntitySize, { container: string; icon: number; text: string }> = {
  sm: { container: "w-8 h-8", icon: 14, text: "text-xs" },
  md: { container: "w-10 h-10", icon: 18, text: "text-sm" },
  lg: { container: "w-12 h-12", icon: 22, text: "text-base" },
};

const typeConfig: Record<EntityType, { bg: string; icon: React.ReactNode }> = {
  user: {
    bg: "bg-blue-100",
    icon: <User className="text-blue-600" />,
  },
  cliente: {
    bg: "bg-green-100",
    icon: <User className="text-green-600" />,
  },
  parceiro: {
    bg: "bg-purple-100",
    icon: <Store className="text-purple-600" />,
  },
  empresa: {
    bg: "bg-indigo-100",
    icon: <Building2 className="text-indigo-600" />,
  },
  sistema: {
    bg: "bg-gray-100",
    icon: <Shield className="text-slate-600" />,
  },
};

export const EntityAvatar: React.FC<EntityAvatarProps> = ({
  name,
  type = "user",
  size = "md",
  imageUrl,
  className = "",
}) => {
  const sizes = sizeConfig[size];
  const config = typeConfig[type];

  // Get initials from name
  const getInitials = (name: string): string => {
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizes.container} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes.container} ${config.bg} rounded-full flex items-center justify-center ${className}`}
    >
      <span className={`font-medium ${config.bg === "bg-gray-100" ? "text-slate-600" : ""}`}>
        {getInitials(name)}
      </span>
    </div>
  );
};

// Versão com ícone (para uso em listas)
export const EntityAvatarWithIcon: React.FC<EntityAvatarProps> = ({
  name,
  type = "user",
  size = "md",
  imageUrl,
  className = "",
}) => {
  const sizes = sizeConfig[size];
  const config = typeConfig[type];

  const getInitials = (name: string): string => {
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizes.container} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes.container} ${config.bg} rounded-full flex items-center justify-center ${className}`}
    >
      {React.cloneElement(config.icon as React.ReactElement, { size: sizes.icon })}
    </div>
  );
};

export default EntityAvatar;
