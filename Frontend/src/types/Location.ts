export interface StateCities {
  state: string;
  cities: string[];
}

export interface LocationsPayload {
  data: StateCities[]; 
}

