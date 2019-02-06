#!/bin/bash

python ./gml_to_pgsql.py test.gml ny | psql -h los.csamlh37qncu.us-east-1.rds.amazonaws.com -U postgres los
