
export enum QueryClassification {
  TRIVIAL = 'TRIVIAL',
  COMPLEX = 'COMPLEX',
}

export interface QueryResult {
  id: string;
  query: string;
  classification: QueryClassification;
  modelUsed: string;
  answer: string;
  error?: string;
}
