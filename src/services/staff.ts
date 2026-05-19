import { appConfig } from '../config/appConfig';

export const verifyStaffPin = (pin: string): boolean => {
  if (!appConfig.mockStaffPinEnabled) return true;
  return pin === appConfig.staffPin;
};
