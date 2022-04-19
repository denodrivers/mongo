import {
  $box,
  $center,
  $centerSphere,
  $geoCollection,
  $geoLineString,
  $geoMultiLineString,
  $geoMultiPoint,
  $geoMultiPolygon,
  $geoPoint,
  $geoPolygon,
  $polygon,
  CenterSpecifier,
  ShapeOperator,
} from "../../src/geospatial_types.ts";

Deno.test({
  name: "Geospatial: sanity tests for types",
  fn: () => {
    const geoPoint: $geoPoint = {
      $geometry: {
        type: "Point",
        coordinates: [40, 5],
      },
    };

    const _geoLineString: $geoLineString = {
      $geometry: {
        type: "LineString",
        coordinates: [[40, 5], [41, 6]],
      },
    };

    const _geoPolygon: $geoPolygon = {
      $geometry: {
        type: "Polygon",
        coordinates: [[[0, 0], [3, 6], [6, 1], [0, 0]]],
      },
    };

    const _geoMultiPoint: $geoMultiPoint = {
      $geometry: {
        type: "MultiPoint",
        coordinates: [
          [-73.9580, 40.8003],
          [-73.9498, 40.7968],
          [-73.9737, 40.7648],
          [-73.9814, 40.7681],
        ],
      },
    };

    const _geoMultiLineString: $geoMultiLineString = {
      $geometry: {
        type: "MultiLineString",
        coordinates: [
          [[-73.96943, 40.78519], [-73.96082, 40.78095]],
          [[-73.96415, 40.79229], [-73.95544, 40.78854]],
          [[-73.97162, 40.78205], [-73.96374, 40.77715]],
          [[-73.97880, 40.77247], [-73.97036, 40.76811]],
        ],
      },
    };

    const _geoMultiPolygon: $geoMultiPolygon = {
      $geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [-73.958, 40.8003],
              [-73.9498, 40.7968],
              [-73.9737, 40.7648],
              [-73.9814, 40.7681],
              [-73.958, 40.8003],
            ],
          ],
          [
            [
              [-73.958, 40.8003],
              [-73.9498, 40.7968],
              [-73.9737, 40.7648],
              [-73.958, 40.8003],
            ],
          ],
        ],
      },
    };

    const _geoCollection: $geoCollection = {
      $geometry: {
        type: "GeometryCollection",
        geometries: [
          {
            type: "MultiPoint",
            coordinates: [
              [-73.9580, 40.8003],
              [-73.9498, 40.7968],
              [-73.9737, 40.7648],
              [-73.9814, 40.7681],
            ],
          },
          {
            type: "MultiLineString",
            coordinates: [
              [[-73.96943, 40.78519], [-73.96082, 40.78095]],
              [[-73.96415, 40.79229], [-73.95544, 40.78854]],
              [[-73.97162, 40.78205], [-73.96374, 40.77715]],
              [[-73.97880, 40.77247], [-73.97036, 40.76811]],
            ],
          },
        ],
      },
    };

    const box: $box = { $box: [[0, 0], [100, 100]] };
    const polygon: $polygon = { $polygon: [[0, 0], [3, 6], [6, 0]] };
    const center: $center = { $center: [[-74, 40.74], 10] };
    const centerSphere: $centerSphere = {
      $centerSphere: [[-88, 30], 10 / 3963.2],
    };

    // union type tests
    const _shapeOperator1: ShapeOperator = box;
    const _shapeOperator2: ShapeOperator = polygon;
    const _shapeOperator3: ShapeOperator = center;
    const _shapeOperator4: ShapeOperator = centerSphere;

    const _centerSpecifier1: CenterSpecifier = geoPoint;
    const _centerSpecifier2: CenterSpecifier = { ...geoPoint, $minDistance: 1 };
    const _centerSpecifier3: CenterSpecifier = { ...geoPoint, $maxDistance: 1 };
    const _centerSpecifier4: CenterSpecifier = {
      ...geoPoint,
      $minDistance: 1,
      $maxDistance: 1,
    };
    const _legacyPoint: CenterSpecifier = [0, 1];
    const _documentStylePoint: CenterSpecifier = { lon: 0, lat: 1 };
  },
});