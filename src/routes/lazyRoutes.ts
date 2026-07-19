import { lazy } from "react";

export const loadCalculatorPage = () => import("../pages/CalculatorPage/CalculatorPage");
export const loadNotFoundPage = () => import("../pages/NotFoundPage/NotFoundPage");
export const loadPortfolioModal = () => import("../components/Modal/Modal");
export const loadChatWidget = () => import("../components/ChatWidget/ChatWidget");

export const CalculatorPage = lazy(loadCalculatorPage);
export const NotFoundPage = lazy(loadNotFoundPage);
export const PortfolioModal = lazy(loadPortfolioModal);
export const ChatWidget = lazy(loadChatWidget);
