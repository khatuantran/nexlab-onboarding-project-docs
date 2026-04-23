import { z } from "zod";
import { slugSchema } from "./feature.js";

export const createProjectRequestSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1, "Tên project bắt buộc").max(120, "Tên project tối đa 120 ký tự"),
  description: z.string().max(1000, "Mô tả tối đa 1000 ký tự").optional(),
});

export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;
