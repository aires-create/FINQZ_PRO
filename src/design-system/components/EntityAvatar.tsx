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
    bg: "bg-blue-950/40",
    icon: <User className="text-blue-300" />,
  },
  cliente: {
    bg: "bg-emerald-950/40",
    icon: <User className="text-emerald-300" />,
  },
  parceiro: {
    bg: "bg-violet-950/40",
    icon: <Store className="text-violet-300" />,
  },
  empresa: {
    bg: "bg-indigo-950/40",
    icon: <Building2 className="text-indigo-300" />,
  },
  sistema: {
    bg: "bg-slate-800",
    icon: <Shield className="text-slate-300" />,
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
      <span className="font-medium text-slate-200">
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
