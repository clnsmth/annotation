"""
Unit tests for the eml_geo module — EML geographic coverage to GeoJSON conversion.
"""

import json
from webapp.utils.eml_geo import GeographicCoverage


class TestGeomType:
    """Tests for geom_type detection."""

    def test_envelope(self):
        geo = GeographicCoverage(
            {"west": -121.8, "east": -121.7, "north": 47.4, "south": 47.3}
        )
        assert geo.geom_type() == "envelope"

    def test_point(self):
        geo = GeographicCoverage(
            {"west": -121.8, "east": -121.8, "north": 47.4, "south": 47.4}
        )
        assert geo.geom_type() == "point"

    def test_polygon_gring(self):
        geo = GeographicCoverage(
            {
                "west": -121.8,
                "east": -121.7,
                "north": 47.4,
                "south": 47.3,
                "outerGRing": "-121.8,47.3 -121.7,47.3 -121.7,47.4 -121.8,47.4",
            }
        )
        assert geo.geom_type() == "polygon"

    def test_none_for_empty(self):
        geo = GeographicCoverage({})
        assert geo.geom_type() is None


class TestToGeoJsonGeometry:
    """Tests for to_geojson_geometry conversion."""

    def test_envelope_to_polygon(self):
        geo = GeographicCoverage(
            {"west": -121.9, "east": -121.8, "north": 47.4, "south": 47.3}
        )
        result = geo.to_geojson_geometry()
        assert result is not None
        parsed = json.loads(result)
        assert parsed["type"] == "Polygon"
        coords = parsed["coordinates"][0]
        assert len(coords) == 5  # Closed polygon (first == last)
        assert coords[0] == coords[-1]

    def test_point_to_point(self):
        geo = GeographicCoverage(
            {"west": -121.8, "east": -121.8, "north": 47.4, "south": 47.4}
        )
        result = geo.to_geojson_geometry()
        assert result is not None
        parsed = json.loads(result)
        assert parsed["type"] == "Point"
        assert parsed["coordinates"] == [-121.8, 47.4]

    def test_polygon_gring(self):
        ring = "-121.8,47.3 -121.7,47.3 -121.7,47.4 -121.8,47.4 -121.8,47.3"
        geo = GeographicCoverage(
            {
                "west": -121.8,
                "east": -121.7,
                "north": 47.4,
                "south": 47.3,
                "outerGRing": ring,
            }
        )
        result = geo.to_geojson_geometry()
        parsed = json.loads(result)
        assert parsed["type"] == "Polygon"
        coords = parsed["coordinates"][0]
        assert coords[0] == coords[-1]  # Closed ring

    def test_altitude_as_z_coordinate(self):
        import pytest

        with pytest.warns(
            UserWarning, match="Altitude minimum and maximum are different"
        ):
            geo = GeographicCoverage(
                {
                    "west": -121.8,
                    "east": -121.8,
                    "north": 47.4,
                    "south": 47.4,
                    "altitudeMinimum": 100,
                    "altitudeMaximum": 200,
                    "altitudeUnits": "meter",
                }
            )
            result = geo.to_geojson_geometry()

        parsed = json.loads(result)
        assert parsed["type"] == "Point"
        # Average altitude = 150
        assert parsed["coordinates"] == [-121.8, 47.4, 150.0]

    def test_none_for_empty(self):
        geo = GeographicCoverage({})
        assert geo.to_geojson_geometry() is None


class TestCoordinateAccessors:
    """Tests for coordinate accessor methods."""

    def test_accessors(self):
        data = {
            "west": "-121.9",
            "east": "-121.8",
            "north": "47.4",
            "south": "47.3",
        }
        geo = GeographicCoverage(data)
        assert geo.west() == -121.9
        assert geo.east() == -121.8
        assert geo.north() == 47.4
        assert geo.south() == 47.3

    def test_none_when_missing(self):
        geo = GeographicCoverage({})
        assert geo.west() is None
        assert geo.east() is None
        assert geo.north() is None
        assert geo.south() is None


class TestAltitude:
    """Tests for altitude handling."""

    def test_altitude_conversion(self):
        geo = GeographicCoverage(
            {
                "west": 0,
                "east": 0,
                "north": 0,
                "south": 0,
                "altitudeMinimum": 1000,
                "altitudeMaximum": 1000,
                "altitudeUnits": "foot",
            }
        )
        alt = geo.altitude_minimum(to_meters=True)
        assert alt is not None
        assert abs(alt - 304.8) < 0.1

    def test_altitude_with_unknown_units_returns_raw_value(self):
        geo = GeographicCoverage(
            {
                "west": 0,
                "east": 0,
                "north": 0,
                "south": 0,
                "altitudeMinimum": 100,
                "altitudeMaximum": 200,
                "altitudeUnits": "unknown_unit",
            }
        )
        # Unknown units → conversion is skipped, raw value returned
        assert geo.altitude_minimum(to_meters=True) == 100.0
        # Without conversion flag, raw value is also returned
        assert geo.altitude_minimum(to_meters=False) == 100.0
