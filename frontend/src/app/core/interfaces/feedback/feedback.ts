export type NotaFeedback = 1 | 2 | 3 | 4 | 5;

export interface CreateFeedbackRequest {
  nota: NotaFeedback;
  comentario?: string;
  pagina?: string;
}

export interface Feedback {
  id: number;
  nota: NotaFeedback;
  comentario: string | null;
  pagina: string | null;
  createdAt: string;
}
