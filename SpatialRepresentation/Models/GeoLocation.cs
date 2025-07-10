using System;

namespace SpatialRepresentation.Models
{
    /// <summary>
    /// Represents geographical coordinates (latitude and longitude)
    /// </summary>
    public class GeoLocation
    {
        /// <summary>
        /// Latitude in decimal degrees
        /// </summary>
        public double Latitude { get; set; }

        /// <summary>
        /// Longitude in decimal degrees
        /// </summary>
        public double Longitude { get; set; }

        /// <summary>
        /// Optional elevation in meters
        /// </summary>
        public double? Elevation { get; set; }

        /// <summary>
        /// Default constructor
        /// </summary>
        public GeoLocation() { }

        /// <summary>
        /// Constructor with latitude and longitude
        /// </summary>
        /// <param name="latitude">Latitude in decimal degrees</param>
        /// <param name="longitude">Longitude in decimal degrees</param>
        public GeoLocation(double latitude, double longitude)
        {
            Latitude = latitude;
            Longitude = longitude;
        }

        /// <summary>
        /// Constructor with latitude, longitude and elevation
        /// </summary>
        /// <param name="latitude">Latitude in decimal degrees</param>
        /// <param name="longitude">Longitude in decimal degrees</param>
        /// <param name="elevation">Elevation in meters</param>
        public GeoLocation(double latitude, double longitude, double elevation)
        {
            Latitude = latitude;
            Longitude = longitude;
            Elevation = elevation;
        }

        /// <summary>
        /// Calculates distance between two points using Haversine formula
        /// </summary>
        /// <param name="other">Other location</param>
        /// <returns>Distance in kilometers</returns>
        public double DistanceTo(GeoLocation other)
        {
            const double earthRadius = 6371; // Earth's radius in kilometers

            var lat1Rad = Latitude * Math.PI / 180;
            var lat2Rad = other.Latitude * Math.PI / 180;
            var deltaLat = (other.Latitude - Latitude) * Math.PI / 180;
            var deltaLon = (other.Longitude - Longitude) * Math.PI / 180;

            var a = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2) +
                    Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                    Math.Sin(deltaLon / 2) * Math.Sin(deltaLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return earthRadius * c;
        }

        /// <summary>
        /// Returns a string representation of the location
        /// </summary>
        /// <returns>Formatted string with lat/lng</returns>
        public override string ToString()
        {
            return $"Lat: {Latitude:F6}, Lng: {Longitude:F6}";
        }
    }
} 