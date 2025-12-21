import Papa from 'papaparse';

export interface ParseResult<T> {
  data: T[];
  errors: string[];
}

export interface WaypointRow {
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  points: string;
  icon?: string;
  category?: string;
  directions_note?: string;
}

export interface ChallengeRow {
  title: string;
  description: string;
  points: string;
  category?: string;
}

export interface RouteRow {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
}

export function parseWaypointsCSV(file: File): Promise<ParseResult<WaypointRow>> {
  return new Promise((resolve) => {
    Papa.parse<WaypointRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];

        results.data.forEach((row, index) => {
          const rowNum = index + 2; // Header is row 1

          if (!row.name?.trim()) {
            errors.push(`Row ${rowNum}: Missing name`);
          }
          if (!row.latitude || isNaN(parseFloat(row.latitude))) {
            errors.push(`Row ${rowNum}: Invalid latitude`);
          }
          if (!row.longitude || isNaN(parseFloat(row.longitude))) {
            errors.push(`Row ${rowNum}: Invalid longitude`);
          }

          const lat = parseFloat(row.latitude);
          const lng = parseFloat(row.longitude);

          if (!isNaN(lat) && (lat < -90 || lat > 90)) {
            errors.push(`Row ${rowNum}: Latitude must be between -90 and 90`);
          }
          if (!isNaN(lng) && (lng < -180 || lng > 180)) {
            errors.push(`Row ${rowNum}: Longitude must be between -180 and 180`);
          }
        });

        resolve({ data: results.data, errors });
      },
    });
  });
}

export function parseChallengesCSV(file: File): Promise<ParseResult<ChallengeRow>> {
  return new Promise((resolve) => {
    Papa.parse<ChallengeRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];

        results.data.forEach((row, index) => {
          const rowNum = index + 2;

          if (!row.title?.trim()) {
            errors.push(`Row ${rowNum}: Missing title`);
          }
          if (!row.description?.trim()) {
            errors.push(`Row ${rowNum}: Missing description`);
          }
          if (!row.points || isNaN(parseInt(row.points))) {
            errors.push(`Row ${rowNum}: Invalid points value`);
          }
        });

        resolve({ data: results.data, errors });
      },
    });
  });
}

export function parseRouteCSV(file: File): Promise<ParseResult<RouteRow>> {
  return new Promise((resolve) => {
    Papa.parse<RouteRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];

        if (results.data.length === 0) {
          errors.push('No route data found');
        } else {
          const row = results.data[0];
          if (!row.name?.trim()) {
            errors.push('Missing route name');
          }
          if (!row.start_date) {
            errors.push('Missing start date');
          }
          if (!row.end_date) {
            errors.push('Missing end date');
          }
        }

        resolve({ data: results.data, errors });
      },
    });
  });
}

// Transform parsed data to database format
export function transformWaypoints(data: WaypointRow[], routeId: string) {
  return data.map((row, index) => ({
    route_id: routeId,
    name: row.name.trim(),
    description: row.description?.trim() || '',
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    points: parseInt(row.points) || 1,
    icon: row.icon?.trim() || 'checkpoint',
    category: row.category?.trim() || null,
    directions_note: row.directions_note?.trim() || null,
    sort_order: index,
  }));
}

export function transformChallenges(data: ChallengeRow[], routeId: string) {
  return data.map((row, index) => ({
    route_id: routeId,
    title: row.title.trim(),
    description: row.description?.trim() || '',
    points: parseInt(row.points) || 1,
    category: row.category?.trim() || null,
    sort_order: index,
  }));
}

export function transformRoute(data: RouteRow) {
  return {
    name: data.name.trim(),
    description: data.description?.trim() || null,
    start_date: data.start_date,
    end_date: data.end_date,
    is_active: true,
  };
}
