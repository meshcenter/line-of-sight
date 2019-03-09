# Line of Sight

Check if line of sight exists between any two addresses in NYC.

## Getting Started

Install dependencies:

- Python
- Postgres
- PostGIS

Create a table in the db:

```sql
CREATE TABLE ny(gid SERIAL PRIMARY KEY, bldg_id varchar(255), bldg_bin varchar(255), geom GEOMETRY('MULTIPOLYGONZ', 2263))
```

Download the [building data](https://www1.nyc.gov/site/doitt/initiatives/3d-building.page):

```bash
curl -o data.zip http://maps.nyc.gov/download/3dmodel/DA_WISE_GML.zip
unzip data.zip -d data
rm data.zip
```

Insert the data:

```bash
# 12 and 13 are Manhattan
python2 ./scripts/gml_to_pgsql.py ./data/DA_WISE_GMLs/DA12_3D_Buildings_Merged.gml ny | psql db
python2 ./scripts/gml_to_pgsql.py ./data/DA_WISE_GMLs/DA13_3D_Buildings_Merged.gml ny | psql db
```

Now we are ready to make queries!

## Making Queries

Let's check for line of sight between [Supernode 1 and Node 3](https://www.nycmesh.net/map/nodes/227-3).

Get building midpoints:

```sql
SELECT ST_AsText(ST_Centroid((SELECT geom FROM ny WHERE bldg_bin = '1001389'))) as a,
ST_AsText(ST_Centroid((SELECT geom FROM ny WHERE bldg_bin = '1006184'))) as b;
#                     a                     |                    b
# ------------------------------------------+------------------------------------------
#  POINT(987642.232749068 203357.276907034) | POINT(983915.956115596 198271.837494287)
# (1 row)
```

Check for intersections:

```sql
SELECT a.bldg_bin
FROM ny AS a
# Use midpoints from previous step (estimate z for now)
WHERE ST_3DIntersects(a.geom, ST_SetSRID('LINESTRINGZ (983915 198271 400, 987642 203357 100)'::geometry, 2263));
#  bldg_bin
# ----------
#  1001389
#  1006184
# (2 rows)
```

There are no intersections (the buildings themselves don't count). We have line of sight!
