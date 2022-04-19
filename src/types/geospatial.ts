import { Document } from "../../deps.ts";
import {
  GeoJsonObject,
  GeometryCollection,
  GeometryObject,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  Position,
} from "./geojson.ts";

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/geometry/#mongodb-query-op.-geometry
 */
interface GeoJsonOperators<G extends GeoJsonObject> {
  $geometry: G & CoordinateReferenceSystem;
}

/**
 * https://datatracker.ietf.org/doc/html/rfc7946#section-4
 */
interface CoordinateReferenceSystem {
  crs?: {
    type: string;
    properties: { name: string };
  };
}

/**
 * https://www.mongodb.com/docs/manual/reference/operator/query/minDistance/
 * https://www.mongodb.com/docs/manual/reference/operator/query/maxDistance/
 */
export interface DistanceConstraint {
  $minDistance?: number;
  $maxDistance?: number;
}

export type LegacyPoint = Position;

/**
 * Example:
 *
 * ```ts
 * {
 *    $geometry: GeometryObject, // any GeoJSON object
 * }
 * ```
 */
export type $geoAny = GeoJsonOperators<GeometryObject>;

/**
 * Example:
 *
 * ```ts
 * {
 *   $geometry: { type: "Point", coordinates: [ 40, 5 ] },
 * }
 * ```
 *
 * https://www.mongodb.com/docs/manual/reference/geojson/#point
 */
export type $geoPoint = GeoJsonOperators<Point>;

/**
 * Example:
 *
 * ```ts
 * {
 *   $geometry: { type: "LineString", coordinates: [ [ 40, 5 ], [ 41, 6 ] ] }
 * }
 * ```
 *
 * https://www.mongodb.com/docs/manual/reference/geojson/#linestring
 */
export type $geoLineString = GeoJsonOperators<LineString>;

/**
 * Example:
 *
 * ```ts
 * {
 *   $geometry: {
 *     type: "Polygon",
 *     coordinates: [ [ [ 0 , 0 ] , [ 3 , 6 ] , [ 6 , 1 ] , [ 0 , 0 ] ] ]
 *   },
 * }
 *
 * ```
 * https://www.mongodb.com/docs/manual/reference/geojson/#polygon
 */
export type $geoPolygon = GeoJsonOperators<Polygon>;

/**
 * Example:
 *
 * ```ts
 * {
 *   $geometry: {
 *     type: "MultiPoint",
 *     coordinates: [
 *       [ -73.9580, 40.8003 ],
 *       [ -73.9498, 40.7968 ],
 *       [ -73.9737, 40.7648 ],
 *       [ -73.9814, 40.7681 ]
 *     ]
 *   },
 * }
 * ```
 *
 * https://www.mongodb.com/docs/manual/reference/geojson/#multipoint
 */
export type $geoMultiPoint = GeoJsonOperators<MultiPoint>;

/**
 * Example:
 *
 * ```ts
 * {
 *   $geometry: {
 *     type: "MultiLineString",
 *     coordinates: [
 *       [ [ -73.96943, 40.78519 ], [ -73.96082, 40.78095 ] ],
 *       [ [ -73.96415, 40.79229 ], [ -73.95544, 40.78854 ] ],
 *       [ [ -73.97162, 40.78205 ], [ -73.96374, 40.77715 ] ],
 *       [ [ -73.97880, 40.77247 ], [ -73.97036, 40.76811 ] ]
 *     ]
 *   }
 * }
 * ```
 *
 * https://www.mongodb.com/docs/manual/reference/geojson/#multilinestring
 */
export type $geoMultiLineString = GeoJsonOperators<MultiLineString>;

/**
 * Example:
 *
 * ```ts
 * {
 *   $geometry: {
 *     type: "MultiPolygon",
 *     coordinates: [
 *       [ [ [ -73.958, 40.8003 ], [ -73.9498, 40.7968 ], [ -73.9737, 40.7648 ], [ -73.9814, 40.7681 ], [ -73.958, 40.8003 ] ] ],
 *       [ [ [ -73.958, 40.8003 ], [ -73.9498, 40.7968 ], [ -73.9737, 40.7648 ], [ -73.958, 40.8003 ] ] ]
 *     ]
 *   },
 * }
 * ```
 *
 * https://www.mongodb.com/docs/manual/reference/geojson/#multipolygon
 */
export type $geoMultiPolygon = GeoJsonOperators<MultiPolygon>;

/**
 * Example:
 *
 * ```ts
 * {
 *   $geometry: {
 *     type: "GeometryCollection",
 *     geometries: [
 *       {
 *         type: "MultiPoint",
 *         coordinates: [
 *           [ -73.9580, 40.8003 ],
 *           [ -73.9498, 40.7968 ],
 *           [ -73.9737, 40.7648 ],
 *           [ -73.9814, 40.7681 ]
 *         ]
 *       },
 *       {
 *         type: "MultiLineString",
 *         coordinates: [
 *           [ [ -73.96943, 40.78519 ], [ -73.96082, 40.78095 ] ],
 *           [ [ -73.96415, 40.79229 ], [ -73.95544, 40.78854 ] ],
 *           [ [ -73.97162, 40.78205 ], [ -73.96374, 40.77715 ] ],
 *           [ [ -73.97880, 40.77247 ], [ -73.97036, 40.76811 ] ]
 *         ]
 *       }
 *     ]
 *   }
 * }
 * ```
 *
 * https://www.mongodb.com/docs/manual/reference/geojson/#geometrycollection
 */
export type $geoCollection = GeoJsonOperators<GeometryCollection>;

/**
 * Example:
 *
 * ```ts
 * { $box:  [ [ 0, 0 ], [ 100, 100 ] ] }
 * ```
 *
 * https://www.mongodb.com/docs/manual/reference/operator/query/box/#-box
 */
export type $box = { $box: [LegacyPoint, LegacyPoint] };

/**
 * Example:
 *
 * ```ts
 * { $polygon: [ [ 0 , 0 ], [ 3 , 6 ], [ 6 , 0 ] ] }
 * ```
 *
 * https://www.mongodb.com/docs/manual/reference/operator/query/polygon/#-polygon
 */
export type $polygon = { $polygon: LegacyPoint[] };

/**
 * Example:
 *
 * ```ts
 * { $center: [ [-74, 40.74], 10 ] }
 * ```
 *
 * https://www.mongodb.com/docs/manual/reference/operator/query/center/#definition
 */
export type $center = { $center: [LegacyPoint, number] };

/**
 * Example:
 *
 * ```ts
 * { $centerSphere: [ [ -88, 30 ], 10/3963.2 ] }
 * ```
 *
 * https://www.mongodb.com/docs/manual/reference/operator/query/centerSphere/#-centersphere
 */
export type $centerSphere = { $centerSphere: [LegacyPoint, number] };

export type ShapeOperator =
  | $box
  | $polygon
  | $center
  | $centerSphere;

export type CenterSpecifier =
  | ($geoPoint & DistanceConstraint)
  | LegacyPoint
  | Document;
