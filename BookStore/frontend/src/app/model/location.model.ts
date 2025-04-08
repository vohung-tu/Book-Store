export interface Ward {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
  data3: Ward[];
}

export interface Province {
  id: string;
  name: string;
  data2: District[];
}
