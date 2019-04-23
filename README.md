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

### Step 1: Look up BINs:

Use [NYC GeoSearch](https://geosearch.planninglabs.nyc/docs/) or [NYC Building Information Search](http://a810-bisweb.nyc.gov/bisweb/bispi00.jsp).

Supernode 1 BIN: `1001389`  
Node 3 BIN: `1006184`

### Step 2: Get building midpoints:

```sql
SELECT ST_AsText(ST_Centroid((SELECT geom FROM ny WHERE bldg_bin = '1001389'))) as a,
ST_AsText(ST_Centroid((SELECT geom FROM ny WHERE bldg_bin = '1006184'))) as b;
#                     a                     |                    b
# ------------------------------------------+------------------------------------------
#  POINT(987642.232749068 203357.276907034) | POINT(983915.956115596 198271.837494287)
# (1 row)
```

### Step 3: Get building heights:

```sql
SELECT ST_ZMax((SELECT geom FROM ny WHERE bldg_bin = '1001389')) as a,
ST_ZMax((SELECT geom FROM ny WHERE bldg_bin = '1006184')) as b;
#         a         |        b         
# ------------------+------------------
#  582.247499999998 | 120.199699999997
# (1 row)
```


### Step 4: Check for intersections:

```sql
SELECT a.bldg_bin
FROM ny AS a
WHERE ST_3DIntersects(a.geom, ST_SetSRID('LINESTRINGZ (983915 198271 582, 987642 203357 120)'::geometry, 2263));
#  bldg_bin
# ----------
# (0 rows)
```

There are no intersections. We have line of sight!

## Roadmap

- [ ] Test against known good lines of sight
- [ ] Move db to cloud
- [ ] API
- [ ] Web UI
