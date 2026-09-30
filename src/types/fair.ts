export type Region = {
  name: string;
  PN: number;
  SW: number;
  KP: number;
  SA: number;
};

export type FairResult = {
  name: string;
  pnW: number;
  swW: number;
  kpW: number;
  saW: number;
  score: number;
  varFee: number;
};

export type OrganisationGroup = {
  reg: string;
  list: [string, number, number][];
};

export type Language = 'de' | 'it';
export type SaveMode = 'local' | 'waiting' | 'cloud' | 'error';
