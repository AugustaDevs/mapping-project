export interface POI {
	id: string;
	name: string;
	emoji: string;
	coordinates: {
		lat: number;
		lng: number;
	};
	address: {
		street: string;
		city: string;
		state: string;
		zipCode?: string;
	};
	category: string;
	description?: string;
	area: string;
	needsCoordinateUpdate?: boolean;
	markerSize?: number;
}

export type POICollection = POI[];
