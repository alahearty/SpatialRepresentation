using System;

namespace SpatialRepresentation.Models
{
    /// <summary>
    /// Represents a flow station in the oil and gas field
    /// </summary>
    public class FlowStation
    {
        /// <summary>
        /// Unique identifier for the flow station
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Name of the flow station
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Geographical location of the flow station
        /// </summary>
        public GeoLocation Location { get; set; }

        public FlowStation()
        {
            Id = Guid.NewGuid().ToString();
            Location = new GeoLocation();
        }

        public FlowStation(string name, double latitude, double longitude)
        {
            Id = Guid.NewGuid().ToString();
            Name = name;
            Location = new GeoLocation(latitude, longitude);
        }
    }
} 