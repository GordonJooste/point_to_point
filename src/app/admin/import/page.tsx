'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Upload,
  FileText,
  AlertCircle,
  Check,
  Loader2,
  MapPin,
  Trophy,
  Route as RouteIcon,
} from 'lucide-react';
import {
  parseWaypointsCSV,
  parseChallengesCSV,
  parseRouteCSV,
  transformWaypoints,
  transformChallenges,
  transformRoute,
  WaypointRow,
  ChallengeRow,
  RouteRow,
} from '@/lib/csv/parser';

type ImportType = 'route' | 'waypoints' | 'challenges';

interface ImportState {
  file: File | null;
  data: any[] | null;
  errors: string[];
  isImporting: boolean;
  result: { success: boolean; message: string } | null;
}

const initialState: ImportState = {
  file: null,
  data: null,
  errors: [],
  isImporting: false,
  result: null,
};

export default function ImportPage() {
  const [activeRoute, setActiveRoute] = useState<any>(null);
  const [routeState, setRouteState] = useState<ImportState>(initialState);
  const [waypointsState, setWaypointsState] = useState<ImportState>(initialState);
  const [challengesState, setChallengesState] = useState<ImportState>(initialState);

  const routeInputRef = useRef<HTMLInputElement>(null);
  const waypointsInputRef = useRef<HTMLInputElement>(null);
  const challengesInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchActiveRoute();
  }, []);

  async function fetchActiveRoute() {
    const { data } = await supabase
      .from('routes')
      .select('*')
      .eq('is_active', true)
      .single();
    setActiveRoute(data);
  }

  // Route import handlers
  async function handleRouteFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setRouteState({ ...initialState, file });
    const result = await parseRouteCSV(file);
    setRouteState((prev) => ({
      ...prev,
      data: result.data,
      errors: result.errors,
    }));
  }

  async function handleRouteImport() {
    if (!routeState.data?.[0]) return;

    setRouteState((prev) => ({ ...prev, isImporting: true }));

    // Deactivate existing routes
    await supabase.from('routes').update({ is_active: false }).eq('is_active', true);

    // Insert new route
    const routeData = transformRoute(routeState.data[0] as RouteRow);
    const { data, error } = await supabase.from('routes').insert(routeData).select().single();

    if (error) {
      setRouteState((prev) => ({
        ...prev,
        isImporting: false,
        result: { success: false, message: error.message },
      }));
    } else {
      setActiveRoute(data);
      setRouteState((prev) => ({
        ...prev,
        isImporting: false,
        result: { success: true, message: 'Route imported successfully!' },
      }));
    }
  }

  // Waypoints import handlers
  async function handleWaypointsFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setWaypointsState({ ...initialState, file });
    const result = await parseWaypointsCSV(file);
    setWaypointsState((prev) => ({
      ...prev,
      data: result.data,
      errors: result.errors,
    }));
  }

  async function handleWaypointsImport() {
    if (!waypointsState.data || !activeRoute) return;

    setWaypointsState((prev) => ({ ...prev, isImporting: true }));

    // Delete existing waypoints for this route
    await supabase.from('waypoints').delete().eq('route_id', activeRoute.id);

    // Insert new waypoints
    const waypoints = transformWaypoints(waypointsState.data as WaypointRow[], activeRoute.id);
    const { error } = await supabase.from('waypoints').insert(waypoints);

    if (error) {
      setWaypointsState((prev) => ({
        ...prev,
        isImporting: false,
        result: { success: false, message: error.message },
      }));
    } else {
      setWaypointsState((prev) => ({
        ...prev,
        isImporting: false,
        result: { success: true, message: `${waypoints.length} waypoints imported!` },
      }));
    }
  }

  // Challenges import handlers
  async function handleChallengesFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setChallengesState({ ...initialState, file });
    const result = await parseChallengesCSV(file);
    setChallengesState((prev) => ({
      ...prev,
      data: result.data,
      errors: result.errors,
    }));
  }

  async function handleChallengesImport() {
    if (!challengesState.data || !activeRoute) return;

    setChallengesState((prev) => ({ ...prev, isImporting: true }));

    // Delete existing challenges for this route
    await supabase.from('challenges').delete().eq('route_id', activeRoute.id);

    // Insert new challenges
    const challenges = transformChallenges(challengesState.data as ChallengeRow[], activeRoute.id);
    const { error } = await supabase.from('challenges').insert(challenges);

    if (error) {
      setChallengesState((prev) => ({
        ...prev,
        isImporting: false,
        result: { success: false, message: error.message },
      }));
    } else {
      setChallengesState((prev) => ({
        ...prev,
        isImporting: false,
        result: { success: true, message: `${challenges.length} challenges imported!` },
      }));
    }
  }

  function ImportCard({
    title,
    icon: Icon,
    state,
    inputRef,
    onFileSelect,
    onImport,
    disabled,
    disabledMessage,
  }: {
    title: string;
    icon: any;
    state: ImportState;
    inputRef: React.RefObject<HTMLInputElement>;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onImport: () => void;
    disabled?: boolean;
    disabledMessage?: string;
  }) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Icon className="w-5 h-5 text-gray-600" />
          {title}
        </h3>

        {disabled ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
            {disabledMessage}
          </div>
        ) : (
          <>
            {/* File Input */}
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              onChange={onFileSelect}
              className="hidden"
            />
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">
                {state.file ? state.file.name : 'Click to select CSV file'}
              </p>
            </div>

            {/* Errors */}
            {state.errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Validation Errors
                </div>
                <ul className="text-sm text-red-600 list-disc list-inside max-h-32 overflow-y-auto">
                  {state.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview */}
            {state.data && state.errors.length === 0 && (
              <div className="mt-4">
                <div className="bg-green-50 rounded-lg p-3 mb-3">
                  <p className="text-green-700 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {state.data.length} items ready to import
                  </p>
                </div>

                {/* Preview table */}
                <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(state.data[0] || {}).slice(0, 4).map((key) => (
                          <th key={key} className="px-3 py-2 text-left text-gray-600 font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {state.data.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t">
                          {Object.values(row as Record<string, unknown>).slice(0, 4).map((val, j) => (
                            <td key={j} className="px-3 py-2 truncate max-w-[150px]">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={onImport}
                  disabled={state.isImporting}
                  className="mt-4 w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {state.isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import {state.data.length} items
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Result */}
            {state.result && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  state.result.success
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {state.result.success ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {state.result.message}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Import Data</h2>

      <p className="text-gray-500">
        Upload CSV files to import routes, waypoints, and challenges.
        Import in this order: Route first, then Waypoints and Challenges.
      </p>

      {/* Active Route Status */}
      {activeRoute && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <strong>Active Route:</strong> {activeRoute.name}
          </p>
          <p className="text-blue-600 text-sm">
            Waypoints and challenges will be imported to this route.
          </p>
        </div>
      )}

      {/* Import Cards */}
      <div className="grid gap-6">
        <ImportCard
          title="1. Import Route"
          icon={RouteIcon}
          state={routeState}
          inputRef={routeInputRef as React.RefObject<HTMLInputElement>}
          onFileSelect={handleRouteFileSelect}
          onImport={handleRouteImport}
        />

        <ImportCard
          title="2. Import Waypoints"
          icon={MapPin}
          state={waypointsState}
          inputRef={waypointsInputRef as React.RefObject<HTMLInputElement>}
          onFileSelect={handleWaypointsFileSelect}
          onImport={handleWaypointsImport}
          disabled={!activeRoute}
          disabledMessage="Import a route first before importing waypoints."
        />

        <ImportCard
          title="3. Import Challenges"
          icon={Trophy}
          state={challengesState}
          inputRef={challengesInputRef as React.RefObject<HTMLInputElement>}
          onFileSelect={handleChallengesFileSelect}
          onImport={handleChallengesImport}
          disabled={!activeRoute}
          disabledMessage="Import a route first before importing challenges."
        />
      </div>
    </div>
  );
}
