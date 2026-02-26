import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const successToast = (message: string) => {
  toast.success(message, {
    position: "top-right", // Specify position as a string
    autoClose: 3000, // Auto close after 3 seconds
  });
};

export const errorToast = (message: string) => {
  toast.error(message, {
    position: "top-right", // Specify position as a string
    autoClose: 3000, // Auto close after 3 seconds
  });
};
export const warningToast = (message: string) => {
  toast.warning(message, {
    position: 'top-right',
    autoClose: 4000,
  });
};

export const infoToast = (message: string) => {
  toast.info(message, {
    position: 'top-right',
    autoClose: 3000,
  });
};