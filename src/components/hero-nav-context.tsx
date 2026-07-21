"use client";

import { createContext, useContext } from "react";

export type HeroNavState = {
  pinned: boolean;
  /** Search slot visible (opacity/width animation enabled). */
  searchVisible: boolean;
  /** Search bar interactive (only toggles at threshold, not every scroll frame). */
  searchReveal: boolean;
};

const defaultState: HeroNavState = {
  pinned: false,
  searchVisible: true,
  searchReveal: true,
};

export const HeroNavContext = createContext<HeroNavState>(defaultState);

export function useHeroNav() {
  return useContext(HeroNavContext);
}
