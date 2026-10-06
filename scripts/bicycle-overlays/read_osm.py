#!/usr/bin/env python3
"""Read-only OSM XML/PBF -> NDJSON bridge; classification lives in JavaScript."""
import argparse
import importlib.metadata
import json
import resource
import sys
import time

import osmium


def emit(value):
    print(json.dumps(value, separators=(",", ":"), ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("mode", choices=("relations", "ways"))
    parser.add_argument("--location-index", default="flex_mem")
    args = parser.parse_args()
    start = time.monotonic()
    count = 0
    if args.mode == "relations":
        stream = osmium.FileProcessor(args.input).with_filter(
            osmium.filter.EntityFilter(osmium.osm.RELATION)
        )
        for entity in stream:
            tags = dict(entity.tags)
            if tags.get("route") == "bicycle" or tags.get("route_master") == "bicycle":
                count += 1
                emit({"type": "relation", "id": str(entity.id), "tags": tags,
                      "members": [{"type": m.type, "ref": str(m.ref), "role": m.role}
                                  for m in entity.members]})
    else:
        stream = osmium.FileProcessor(args.input).with_locations(args.location_index).with_filter(
            osmium.filter.EntityFilter(osmium.osm.WAY)
        )
        for entity in stream:
            tags = dict(entity.tags)
            if not ("highway" in tags or any(k.startswith(("cycleway", "bicycle", "disused:highway", "abandoned:highway", "proposed:highway", "construction:highway")) for k in tags)):
                continue
            count += 1
            nodes = list(entity.nodes)
            missing = sum(not n.location.valid() for n in nodes)
            # Never bridge a missing intermediate node with invented geometry.
            coordinates = None if missing else [[n.lon, n.lat] for n in nodes]
            emit({"type": "way", "id": str(entity.id), "version": entity.version,
                  "timestamp": str(entity.timestamp), "tags": tags,
                  "missing_nodes": missing, "coordinates": coordinates})
    peak = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    emit({"type": "reader_stats", "mode": args.mode, "records": count,
          "seconds": round(time.monotonic() - start, 3),
          "peak_rss_bytes": peak if sys.platform == "darwin" else peak * 1024,
          "osmium_version": importlib.metadata.version("osmium")})


if __name__ == "__main__":
    main()
