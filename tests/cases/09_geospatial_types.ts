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
import { Geometry, GeometryObject, Point } from "../../src/types/geojson.ts";
import { testWithClient } from "../common.ts";
import { assert, assertEquals } from "../test.deps.ts";

interface IPlace {
  _id: string;
  name: string;
  location: Point;
  legacyLocation: [number, number]; // a testing field for legacy operators
  legacyLocationDocument: {
    lon: number;
    lat: number;
  };
}

interface INeighborhoods {
  _id: string;
  name: string;
  geometry: GeometryObject;
}

interface IPosition {
  _id: string;
  pos: [number, number];
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
    location: el.location as Point,
    legacyLocation: el.location.coordinates as [number, number],
    legacyLocationDocument: {
      lon: el.location.coordinates[0],
      lat: el.location.coordinates[1],
    },
  }));

const neighborhoodsDataString = await Deno.readTextFile(
  "tests/testdata/sample_neighborhoods.json",
);

const neighborhoodsData: INeighborhoods[] =
  // deno-lint-ignore no-explicit-any
  (JSON.parse(neighborhoodsDataString) as any[]).map((item) => ({
    _id: item._id.$oid,
    name: item.name,
    geometry: item.geometry as Geometry,
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
 *
 * Neighborhoods
 * https://raw.githubusercontent.com/mongodb/docs-assets/geospatial/neighborhoods.json
 */
testWithClient(
  "Geospatial: sanity tests for types by actual querying",
  async (client) => {
    const db = client.database("test");
    await test_$near_and_$nearSphere_queries(db);
    await test_$geoWithin_queries(db);
    await test_$geoIntersects(db);
    await db.collection("mongo_test_places").drop().catch(console.error);
    await db.collection("mongo_test_positions").drop().catch(console.error);
    await db.collection("mongo_test_neighborhoods").drop().catch(console.error);
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

async function test_$geoWithin_queries(db: Database) {
  await test_$geoWithin_by_GeoJson_queries(db);
  await test_$geoWithin_by_ShapeOperators(db);
}

async function test_$geoWithin_by_GeoJson_queries(db: Database) {
  const places = db.collection<IPlace>("mongo_test_places");

  const foundPlacesByPolygon = await places.find({
    location: {
      $geoWithin: {
        $geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-73.857, 40.848],
              [-73.857, 40.849],
              [-73.856, 40.849],
              [-73.856, 40.848],
              [-73.857, 40.848],
            ],
          ],
        },
      },
    },
  }).toArray();

  assert(foundPlacesByPolygon);

  // Manipulated the query so that there should be only one place, which is "Morris Park Bake Shop"
  assertEquals(foundPlacesByPolygon.length, 1);
  assertEquals(foundPlacesByPolygon[0].name, "Morris Park Bake Shop");

  const foundPlacesByMultiPolygon = await places.find({
    location: {
      $geoWithin: {
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
      },
    },
  }).toArray();

  assert(foundPlacesByMultiPolygon);

  // Manipulated the places data so that there should be only one place, which is "Cafe1 & Cafe 4 (American Museum Of Natural History)"
  assertEquals(foundPlacesByMultiPolygon.length, 1);
  assertEquals(
    foundPlacesByMultiPolygon[0].name,
    "Cafe1 & Cafe 4 (American Museum Of Natural History)",
  );
}

async function test_$geoWithin_by_ShapeOperators(db: Database) {
  const positions = db.collection<IPosition>("mongo_test_positions");

  await positions.createIndexes({
    indexes: [
      // An 2d index for `pos`
      {
        name: "pos_2d",
        key: { pos: "2d" },
      },
    ],
  });

  const dataToInsert: Omit<IPosition, "_id">[] = [];
  const xs = [-1, 0, 1];
  const ys = [-1, 0, 1];

  for (const x of xs) {
    for (const y of ys) {
      dataToInsert.push({ pos: [x, y] });
    }
  }

  await positions.insertMany(dataToInsert);

  await test_$geoWithin_by_$box(positions);
  await test_$geoWithin_by_$polygon(positions);
  await test_$geoWithin_by_$center(positions);
  await test_$geoWithin_by_$centerSphere(positions);
}

async function test_$geoWithin_by_$box(positions: Collection<IPosition>) {
  const foundPositions = await positions.find({
    pos: {
      $geoWithin: {
        $box: [
          [-1, -1], // bottom left
          [1, 1], // upper right
        ],
      },
    },
  }).toArray();

  assert(foundPositions);
  assertEquals(foundPositions.length, 9);
}

async function test_$geoWithin_by_$polygon(positions: Collection<IPosition>) {
  const foundPositions = await positions.find({
    pos: {
      $geoWithin: {
        $polygon: [[-1, 0], [0, 1], [1, 0], [0, -1]], // a diamond shaped polygon
      },
    },
  }).toArray();

  assert(foundPositions);
  assertEquals(foundPositions.length, 5);
}

async function test_$geoWithin_by_$center(positions: Collection<IPosition>) {
  const foundPositions = await positions.find({
    pos: {
      $geoWithin: {
        $center: [[0, 0], 1], // a circle with radius 1
      },
    },
  }).toArray();

  assert(foundPositions);
  assertEquals(foundPositions.length, 5);
}

async function test_$geoWithin_by_$centerSphere(
  positions: Collection<IPosition>,
) {
  const foundPositions = await positions.find({
    pos: {
      $geoWithin: {
        $centerSphere: [[0, 0], 0.0174535], // a sphere with 0.0174535 radian
      },
    },
  }).toArray();

  assert(foundPositions);
  // 0.0174535 radian is a bit greater than 1.0, so it covers 5 points in the coordinates
  assertEquals(foundPositions.length, 5);
}

async function test_$geoIntersects(db: Database) {
  const neighborhoods = db.collection<INeighborhoods>(
    "mongo_test_neighborhoods",
  );

  await neighborhoods.createIndexes({
    indexes: [
      // An 2dsphere index for `geometry`
      {
        name: "geometry_2dsphere",
        key: { geometry: "2dsphere" },
        "2dsphereIndexVersion": 3,
      },
    ],
  });

  await neighborhoods.insertMany(neighborhoodsData);

  const intersectionByPoint = await neighborhoods.find({
    geometry: {
      $geoIntersects: {
        $geometry: {
          "type": "Point",
          "coordinates": [-73.95095412329623, 40.77543392621753],
        },
      },
    },
  }).toArray();

  assert(intersectionByPoint);
  assertEquals(intersectionByPoint.length, 1);
  assertEquals(intersectionByPoint[0].name, "Yorkville");

  const intersectionByLineString = await neighborhoods.find({
    geometry: {
      $geoIntersects: {
        $geometry: {
          type: "LineString",
          coordinates: [
            [-73.95852104926365, 40.77889702821282],
            [-73.95095412329623, 40.77543392621753],
          ],
        },
      },
    },
  }).toArray();

  assert(intersectionByLineString);
  assertEquals(intersectionByLineString.length, 1);
  assertEquals(intersectionByLineString[0].name, "Yorkville");

  const intersectionByPolygon = await neighborhoods.find({
    geometry: {
      $geoIntersects: {
        $geometry: {
          type: "Polygon",
          coordinates: [
            [
              [
                -73.95852104926365,
                40.77889702821282,
              ],
              [
                -73.95095412329623,
                40.77543392621753,
              ],
              [
                -73.95296019452276,
                40.779724262361626,
              ],
              [
                -73.95605545882601,
                40.77954043344108,
              ],
              [
                -73.95852104926365,
                40.77889702821282,
              ],
            ],
          ],
        },
      },
    },
  }).toArray();

  assert(intersectionByPolygon);
  assertEquals(intersectionByPolygon.length, 1);
  assertEquals(intersectionByPolygon[0].name, "Yorkville");

  const intersectionByMultiPoint = await neighborhoods.find({
    geometry: {
      $geoIntersects: {
        $geometry: {
          type: "MultiPoint",
          coordinates: [
            [
              -73.95852104926365,
              40.77889702821282,
            ],
            [
              -73.95095412329623,
              40.77543392621753,
            ],
            [
              -73.95296019452276,
              40.779724262361626,
            ],
            [
              -73.95605545882601,
              40.77954043344108,
            ],
            [
              -73.95852104926365,
              40.77889702821282,
            ],
          ],
        },
      },
    },
  }).toArray();

  assert(intersectionByMultiPoint);
  assertEquals(intersectionByMultiPoint.length, 1);
  assertEquals(intersectionByMultiPoint[0].name, "Yorkville");

  const intersectionByMultiLineString = await neighborhoods.find({
    geometry: {
      $geoIntersects: {
        $geometry: {
          type: "MultiLineString",
          coordinates: [
            [
              [
                -73.95852104926365,
                40.77889702821282,
              ],
              [
                -73.95095412329623,
                40.77543392621753,
              ],
            ],
            [
              [
                -73.95605545882601,
                40.77954043344108,
              ],
              [
                -73.95296019452276,
                40.779724262361626,
              ],
            ],
          ],
        },
      },
    },
  }).toArray();

  assert(intersectionByMultiLineString);
  assertEquals(intersectionByMultiLineString.length, 1);
  assertEquals(intersectionByMultiLineString[0].name, "Yorkville");

  const intersectionByMultiPolygon = await neighborhoods.find({
    geometry: {
      $geoIntersects: {
        $geometry: {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [
                  -73.958,
                  40.8003,
                ],
                [
                  -73.9737,
                  40.7648,
                ],
                [
                  -73.9498,
                  40.7968,
                ],
                [
                  -73.958,
                  40.8003,
                ],
              ],
            ],
            [
              [
                [
                  -73.95852104926365,
                  40.77889702821282,
                ],
                [
                  -73.95095412329623,
                  40.77543392621753,
                ],
                [
                  -73.95296019452276,
                  40.779724262361626,
                ],
                [
                  -73.95605545882601,
                  40.77954043344108,
                ],
                [
                  -73.95852104926365,
                  40.77889702821282,
                ],
              ],
            ],
          ],
        },
      },
    },
  }).toArray();

  assert(intersectionByMultiPolygon);
  assertEquals(intersectionByMultiPolygon.length, 1);
  assertEquals(intersectionByMultiPolygon[0].name, "Yorkville");

  const intersectionByCollection = await neighborhoods.find(
    {
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: "GeometryCollection",
            geometries: [
              {
                type: "Point",
                coordinates: [-73.95095412329623, 40.77543392621753],
              },
              {
                type: "MultiPoint",
                coordinates: [
                  [
                    -73.958,
                    40.8003,
                  ],
                  [
                    -73.9498,
                    40.7968,
                  ],
                  [
                    -73.9737,
                    40.7648,
                  ],
                  [
                    -73.9814,
                    40.7681,
                  ],
                ],
              },
              {
                type: "MultiLineString",
                coordinates: [
                  [
                    [
                      -73.96943,
                      40.78519,
                    ],
                    [
                      -73.96082,
                      40.78095,
                    ],
                  ],
                  [
                    [
                      -73.96415,
                      40.79229,
                    ],
                    [
                      -73.95544,
                      40.78854,
                    ],
                  ],
                  [
                    [
                      -73.97162,
                      40.78205,
                    ],
                    [
                      -73.96374,
                      40.77715,
                    ],
                  ],
                  [
                    [
                      -73.9788,
                      40.77247,
                    ],
                    [
                      -73.97036,
                      40.76811,
                    ],
                  ],
                ],
              },
            ],
          },
        },
      },
    },
  ).toArray();

  assert(intersectionByCollection);
  assertEquals(intersectionByCollection.length, 1);
  assertEquals(intersectionByCollection[0].name, "Yorkville");
}
