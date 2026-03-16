"""EML geographic coverage to GeoJSON conversion utilities.

Provides a GeographicCoverage class that wraps geographic coverage data
(as extracted from EML metadata) and converts it to GeoJSON geometry.
Only GeoJSON conversion is supported; ESRI geometry conversion is omitted.
"""

import json
import warnings
from math import isnan
from typing import Union


class GeographicCoverage:
    """Converts EML geographic coverage data to GeoJSON geometry.

    Accepts a dictionary of geographic coverage fields as produced by the
    EML parser (west, east, north, south, altitudeMinimum, altitudeMaximum,
    altitudeUnits, outerGRing, exclusionGRing).
    """

    def __init__(self, geo_dict: dict):
        self._data = geo_dict

    def description(self) -> Union[str, None]:
        """Get geographicDescription."""
        return self._data.get("description")

    def west(self) -> Union[float, None]:
        """Get westBoundingCoordinate."""
        val = self._data.get("west")
        if val is not None:
            return float(val)
        return None

    def east(self) -> Union[float, None]:
        """Get eastBoundingCoordinate."""
        val = self._data.get("east")
        if val is not None:
            return float(val)
        return None

    def north(self) -> Union[float, None]:
        """Get northBoundingCoordinate."""
        val = self._data.get("north")
        if val is not None:
            return float(val)
        return None

    def south(self) -> Union[float, None]:
        """Get southBoundingCoordinate."""
        val = self._data.get("south")
        if val is not None:
            return float(val)
        return None

    def altitude_minimum(self, to_meters=False) -> Union[float, None]:
        """Get altitudeMinimum, optionally converting to meters."""
        val = self._data.get("altitudeMinimum")
        if val is not None:
            res = float(val)
        else:
            res = None
        if to_meters is True:
            res = self._convert_to_meters(x=res, from_units=self.altitude_units())
        return res

    def altitude_maximum(self, to_meters=False) -> Union[float, None]:
        """Get altitudeMaximum, optionally converting to meters."""
        val = self._data.get("altitudeMaximum")
        if val is not None:
            res = float(val)
        else:
            res = None
        if to_meters is True:
            res = self._convert_to_meters(x=res, from_units=self.altitude_units())
        return res

    def altitude_units(self) -> Union[str, None]:
        """Get altitudeUnits."""
        return self._data.get("altitudeUnits")

    def outer_gring(self) -> Union[str, None]:
        """Get datasetGPolygonOuterGRing/gRing value."""
        return self._data.get("outerGRing")

    def exclusion_gring(self) -> Union[str, None]:
        """Get datasetGPolygonExclusionGRing/gRing value."""
        return self._data.get("exclusionGRing")

    def geom_type(self) -> Union[str, None]:
        """Get geometry type from geographic coverage data.

        :return: geometry type as "polygon", "point", or "envelope"
        """
        if self.outer_gring() is not None:
            return "polygon"
        if self.west() is not None and self.north() is not None:
            if self.west() == self.east() and self.north() == self.south():
                return "point"
            return "envelope"
        return None

    def to_geojson_geometry(self) -> Union[str, None]:
        """Convert geographic coverage to GeoJSON geometry.

        :return: GeoJSON geometry as a JSON string, or None

        :notes: If a polygon (gRing) is present, it is used as the true
            geometry. Otherwise bounding coordinates are used.

            Point locations (where bounding box coords are equal) become
            GeoJSON Points. Bounding boxes become GeoJSON Polygons.

            Altitudes are averaged (min+max)/2 and included as
            z-coordinates when present.
        """
        if self.geom_type() == "polygon" or self.geom_type() == "envelope":
            return self._to_geojson_polygon()
        if self.geom_type() == "point":
            return self._to_geojson_point()
        return None

    def _to_geojson_polygon(self) -> str:
        """Convert EML polygon or envelope to GeoJSON polygon geometry."""
        if self.geom_type() == "envelope":
            z = self._average_altitudes()
            coordinates = [
                [self.west(), self.south(), z],
                [self.east(), self.south(), z],
                [self.east(), self.north(), z],
                [self.west(), self.north(), z],
                [self.west(), self.south(), z],
            ]
            coordinates = [
                [val for val in item if val is not None] for item in coordinates
            ]
            res = {
                "type": "Polygon",
                "coordinates": [coordinates],
            }
            return json.dumps(res)

        if self.geom_type() == "polygon":

            def _format_ring(gring):
                ring = []
                z = self._average_altitudes()
                for item in gring.split():
                    x = item.split(",")
                    try:
                        ring.append([float(x[0]), float(x[1]), z])
                    except (TypeError, ValueError, IndexError):
                        ring.append([x[0], x[1], z])
                # Ensure that the first and last points are the same
                if ring[0] != ring[-1]:
                    ring.append(ring[0])
                # Remove None values to comply with GeoJSON spec
                ring = [[val for val in item if val is not None] for item in ring]
                return ring

            if self.outer_gring() is not None:
                ring = _format_ring(self.outer_gring())
                # Ensure ring is valid
                if not ring or len(ring) < 4:
                    return None
                res = {"type": "Polygon", "coordinates": [ring]}
                return json.dumps(res)

        return None

    def _to_geojson_point(self) -> Union[str, None]:
        """Convert EML point to GeoJSON point geometry."""
        if self.geom_type() != "point":
            return None
        z = self._average_altitudes()
        coordinates = [self.west(), self.north(), z]
        # Remove None values to comply with GeoJSON spec
        coordinates = [val for val in coordinates if val is not None]
        res = {"type": "Point", "coordinates": coordinates}
        return json.dumps(res)

    def _average_altitudes(self) -> Union[float, None]:
        """Average the minimum and maximum altitudes.

        :return: average altitude in meters, or None
        :notes: GeoJSON doesn't support a range of z values, so we use
            the average of the minimum and maximum values.
        """
        try:
            altitude_minimum = self.altitude_minimum(to_meters=True)
            altitude_maximum = self.altitude_maximum(to_meters=True)
            z = (altitude_minimum + altitude_maximum) / 2
            if altitude_minimum != altitude_maximum:
                warnings.warn(
                    "Altitude minimum and maximum are different. Using average value."
                )
        except TypeError:
            z = None
        return z

    @staticmethod
    def _convert_to_meters(x, from_units) -> Union[float, None]:
        """Convert a value from a given unit of measurement to meters.

        :param x: value to convert
        :param from_units: Units to convert from
        :return: value in meters
        """
        if x is None:
            x = float("NaN")
        conversion_factors = _load_conversion_factors()
        conversion_factor = conversion_factors.get(from_units, float("NaN"))
        if not isnan(conversion_factor):
            x = x * conversion_factors.get(from_units, float("NaN"))
        if isnan(x):
            x = None
        return x


def _load_conversion_factors() -> dict:
    """Load conversion factors from common units of length to meters."""
    return {
        "meter": 1,
        "decimeter": 1e-1,
        "dekameter": 1e1,
        "hectometer": 1e2,
        "kilometer": 1e3,
        "megameter": 1e6,
        "Foot_US": 0.3048006,
        "foot": 0.3048,
        "Foot_Gold_Coast": 0.3047997,
        "fathom": 1.8288,
        "nauticalMile": 1852,
        "yard": 0.9144,
        "Yard_Indian": 0.914398530744440774,
        "Link_Clarke": 0.2011661949,
        "Yard_Sears": 0.91439841461602867,
        "mile": 1609.344,
    }
