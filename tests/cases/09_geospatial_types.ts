import { Database } from "../../mod.ts";
import { Collection } from "../../src/collection/collection.ts";
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
  DistanceConstraint,
  LegacyPoint,
  ShapeOperator,
} from "../../src/geospatial_types.ts";
import { testWithClient } from "../common.ts";

interface IPlace {
  _id: string;
  name: string;
  location: GeoJSON.Point;
  legacyLocation: [number, number]; // a testing field for legacy operators
  legacyLocationDocument: {
    lon: number;
    lat: number;
  };
}

// Test utility types
type LegacyNearQuery = {
  $near: LegacyPoint;
} & DistanceConstraint;

type LegacyNearSphereQuery = {
  $nearSphere: LegacyPoint;
} & DistanceConstraint;

type LegacyNearDocumentQuery = {
  $near: { lon: number; lat: number };
} & DistanceConstraint;

type LegacyNearSphereDocumentQuery = {
  $nearSphere: { lon: number; lat: number };
} & DistanceConstraint;

const placeDataString = await Deno.readTextFile(
  "tests/testdata/sample_places.json",
);

// deno-lint-ignore no-explicit-any
const placeData: IPlace[] = (JSON.parse(placeDataString) as any[])
  .map((el) => ({
    _id: el._id.$oid,
    name: el.name,
    location: el.location as GeoJSON.Point,
    legacyLocation: el.location.coordinates as [number, number],
    legacyLocationDocument: {
      lon: el.location.coordinates[0],
      lat: el.location.coordinates[1],
    },
  }));

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

/**
 * Sanity tests for geospatial queries.
 *
 * Tests are based on the summary table of geospatial query operators from the link below.
 * https://www.mongodb.com/docs/manual/geospatial-queries/#geospatial-models
 *
 * Test data picked from below links
 * https://www.mongodb.com/docs/manual/tutorial/geospatial-tutorial/#searching-for-restaurants
 *
 * Places
 * https://raw.githubusercontent.com/mongodb/docs-assets/geospatial/restaurants.json
 */
testWithClient(
  "Geospatial: sanity tests for types by actual querying",
  async (client) => {
    const db = client.database("test");
    await test_$near_and_$nearSphere_queries(db);
    await db.collection("mongo_test_places").drop().catch(console.error);
  },
);

async function test_$near_and_$nearSphere_queries(db: Database) {
  const placeCollection = db.collection<IPlace>("mongo_test_places");

  await placeCollection.createIndexes({
    indexes: [
      // An 2dsphere index for `location`
      {
        name: "location_2dsphere",
        key: { location: "2dsphere" },
        "2dsphereIndexVersion": 3,
      },
      // An 2d index for `legacyLocation`
      {
        name: "legacyLocation_2d",
        key: { legacyLocation: "2d" },
      },
      {
        name: "legacyLocationDocument_2d",
        key: { legacyLocationDocument: "2d" },
      },
    ],
  });

  await placeCollection.insertMany(placeData);

  const queries = [
    {
      coordinates: [-73.856077, 40.848447],
    },
    {
      // with a $maxDistance contraint
      coordinates: [-73.856077, 40.848447],
      $maxDistance: 100,
    },
    {
      // with a $minDistance contraint
      coordinates: [-73.856077, 40.848447],
      $minDistance: 100,
    },
    {
      // GeoJSON with a $min/$max distance contraint
      coordinates: [-73.856077, 40.848447],
      $maxDistance: 100,
      $minDistance: 10,
    },
  ];

  await testGeoJsonQueries(placeCollection, queries);
  await testLegacyQueries(placeCollection, queries);
}

async function testGeoJsonQueries(
  placeCollection: Collection<IPlace>,
  queries: ({ coordinates: number[] } & DistanceConstraint)[],
) {
  const geoJsonQueries: ($geoPoint & DistanceConstraint)[] = queries.map(
    (data) => {
      const { coordinates, $maxDistance, $minDistance } = data;
      const geoJsonQueryItem: $geoPoint & DistanceConstraint = {
        $geometry: {
          type: "Point",
          coordinates,
        },
        $minDistance,
        $maxDistance,
      };

      return removeUndefinedDistanceConstraint(geoJsonQueryItem);
    },
  );

  for await (const geoQuery of geoJsonQueries) {
    // with $near
    await placeCollection.find({
      location: {
        $near: geoQuery,
      },
    }).toArray();

    // with $nearSphere
    await placeCollection.find({
      location: {
        $nearSphere: geoQuery,
      },
    }).toArray();
  }
}

async function testLegacyQueries(
  placeCollection: Collection<IPlace>,
  queries: ({ coordinates: number[] } & DistanceConstraint)[],
) {
  const legacyQueries:
    ({ $near: LegacyPoint; $nearSphere: LegacyPoint } & DistanceConstraint)[] =
      queries.map(
        (data) => {
          const { coordinates, $maxDistance, $minDistance } = data;

          const queryItem = {
            $near: coordinates,
            $nearSphere: coordinates,
            $minDistance,
            $maxDistance,
          };

          if ($maxDistance === undefined) {
            delete queryItem["$maxDistance"];
          }
          if ($minDistance === undefined) {
            delete queryItem["$minDistance"];
          }

          return queryItem;
        },
      );

  for await (const query of legacyQueries) {
    // with $near
    await placeCollection.find({
      legacyLocation: query as LegacyNearQuery,
    }).toArray();

    // with $nearSphere
    await placeCollection.find({
      legacyLocation: query as LegacyNearSphereQuery,
    }).toArray();

    const [lon, lat] = query.$near!;
    const { $minDistance, $maxDistance } = query;

    const documentStyleQuery = removeUndefinedDistanceConstraint({
      $near: { lon, lat },
      $nearSphere: { lon, lat },
      $minDistance,
      $maxDistance,
    });

    // with $near
    await placeCollection.find({
      legacyLocationDocument: documentStyleQuery as LegacyNearDocumentQuery,
    }).toArray();

    // with $nearSphere
    await placeCollection.find({
      legacyLocationDocument:
        documentStyleQuery as LegacyNearSphereDocumentQuery,
    }).toArray();
  }
}

function removeUndefinedDistanceConstraint<T>(
  obj: T & DistanceConstraint,
): T & DistanceConstraint {
  const result = { ...obj };
  const { $minDistance, $maxDistance } = obj;

  if ($minDistance === undefined) {
    delete result["$minDistance"];
  }

  if ($maxDistance === undefined) {
    delete result["$maxDistance"];
  }

  return result;
}
