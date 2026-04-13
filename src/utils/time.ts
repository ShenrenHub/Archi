import dayjs from "dayjs";

export const formatDateTime = (value: string | number | Date) =>
  dayjs(value).format("YYYY-MM-DD HH:mm:ss");

export const formatDate = (value: string | number | Date) =>
  dayjs(value).format("YYYY-MM-DD");
