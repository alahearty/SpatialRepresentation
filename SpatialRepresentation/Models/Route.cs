using System;
using System.Collections.Generic;
using System.Linq;

namespace SpatialRepresentation.Models
{
    /// <summary>
    /// Represents a route between two or more points (wells)
    /// </summary>
    public class Route
    {
        /// <summary>
        /// Unique identifier for the route
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Name or description of the route
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Source well (starting point)
        /// </summary>
        public Well SourceWell { get; set; }

        /// <summary>
        /// Destination well (ending point)
        /// </summary>
        public Well DestinationWell { get; set; }

        /// <summary>
        /// Intermediate waypoints (optional)
        /// </summary>
        public List<GeoLocation> Waypoints { get; set; }

        /// <summary>
        /// Calculated route points (from routing service)
        /// </summary>
        public List<GeoLocation> RoutePoints { get; set; }

        /// <summary>
        /// Total distance of the route in kilometers
        /// </summary>
        public double? TotalDistance { get; set; }

        /// <summary>
        /// Estimated travel time in minutes
        /// </summary>
        public double? EstimatedTime { get; set; }

        /// <summary>
        /// Route type (e.g., "Driving", "Walking", "Biking")
        /// </summary>
        public string RouteType { get; set; }

        /// <summary>
        /// Date and time when the route was calculated
        /// </summary>
        public DateTime CalculatedAt { get; set; }

        /// <summary>
        /// Additional route instructions or notes
        /// </summary>
        public string Instructions { get; set; }

        /// <summary>
        /// Route metadata
        /// </summary>
        public Dictionary<string, object> Metadata { get; set; }

        /// <summary>
        /// Default constructor
        /// </summary>
        public Route()
        {
            Id = Guid.NewGuid().ToString();
            Waypoints = new List<GeoLocation>();
            RoutePoints = new List<GeoLocation>();
            Metadata = new Dictionary<string, object>();
            CalculatedAt = DateTime.Now;
        }

        /// <summary>
        /// Constructor with source and destination wells
        /// </summary>
        /// <param name="sourceWell">Source well</param>
        /// <param name="destinationWell">Destination well</param>
        /// <param name="name">Route name</param>
        public Route(Well sourceWell, Well destinationWell, string name = null)
        {
            Id = Guid.NewGuid().ToString();
            SourceWell = sourceWell;
            DestinationWell = destinationWell;
            Name = name ?? $"Route from {sourceWell?.Name} to {destinationWell?.Name}";
            Waypoints = new List<GeoLocation>();
            RoutePoints = new List<GeoLocation>();
            Metadata = new Dictionary<string, object>();
            CalculatedAt = DateTime.Now;
        }

        /// <summary>
        /// Adds a waypoint to the route
        /// </summary>
        /// <param name="waypoint">Waypoint location</param>
        public void AddWaypoint(GeoLocation waypoint)
        {
            if (waypoint != null)
            {
                Waypoints.Add(waypoint);
            }
        }

        /// <summary>
        /// Gets all waypoints including source and destination
        /// </summary>
        /// <returns>Complete list of waypoints</returns>
        public List<GeoLocation> GetAllWaypoints()
        {
            var allWaypoints = new List<GeoLocation>();

            if (SourceWell?.Location != null)
                allWaypoints.Add(SourceWell.Location);

            allWaypoints.AddRange(Waypoints);

            if (DestinationWell?.Location != null)
                allWaypoints.Add(DestinationWell.Location);

            return allWaypoints;
        }

        /// <summary>
        /// Calculates the straight-line distance between source and destination
        /// </summary>
        /// <returns>Distance in kilometers</returns>
        public double GetStraightLineDistance()
        {
            if (SourceWell?.Location == null || DestinationWell?.Location == null)
                return 0;

            return SourceWell.Location.DistanceTo(DestinationWell.Location);
        }

        /// <summary>
        /// Calculates the total route distance including waypoints
        /// </summary>
        /// <returns>Total distance in kilometers</returns>
        public double GetTotalWaypointDistance()
        {
            var waypoints = GetAllWaypoints();
            if (waypoints.Count < 2) return 0;

            double totalDistance = 0;
            for (int i = 0; i < waypoints.Count - 1; i++)
            {
                totalDistance += waypoints[i].DistanceTo(waypoints[i + 1]);
            }

            return totalDistance;
        }

        /// <summary>
        /// Returns a string representation of the route
        /// </summary>
        /// <returns>Route name and distance</returns>
        public override string ToString()
        {
            var distance = TotalDistance ?? GetStraightLineDistance();
            return $"{Name} ({distance:F2} km)";
        }
    }
} 