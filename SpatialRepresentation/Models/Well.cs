using System;
using System.Collections.Generic;
using System.ComponentModel;

namespace SpatialRepresentation.Models
{
    /// <summary>
    /// Represents a well in the oil and gas field
    /// </summary>
    public class Well : INotifyPropertyChanged
    {
        private string _name;
        private string _type;
        private double _depth;
        private GeoLocation _location;
        private string _status;
        private DateTime? _completionDate;
        private double? _productionRate;
        private string _operator;

        /// <summary>
        /// Unique identifier for the well
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Name of the well
        /// </summary>
        public string Name
        {
            get => _name;
            set
            {
                _name = value;
                OnPropertyChanged(nameof(Name));
            }
        }

        /// <summary>
        /// Type of well (e.g., "Oil", "Gas", "Water", "Injection")
        /// </summary>
        public string Type
        {
            get => _type;
            set
            {
                _type = value;
                OnPropertyChanged(nameof(Type));
            }
        }

        /// <summary>
        /// Depth of the well in meters
        /// </summary>
        public double Depth
        {
            get => _depth;
            set
            {
                _depth = value;
                OnPropertyChanged(nameof(Depth));
            }
        }

        /// <summary>
        /// Geographical location of the well
        /// </summary>
        public GeoLocation Location
        {
            get => _location;
            set
            {
                _location = value;
                OnPropertyChanged(nameof(Location));
            }
        }

        /// <summary>
        /// Current status of the well (e.g., "Active", "Inactive", "Abandoned")
        /// </summary>
        public string Status
        {
            get => _status;
            set
            {
                _status = value;
                OnPropertyChanged(nameof(Status));
            }
        }

        /// <summary>
        /// Date when the well was completed
        /// </summary>
        public DateTime? CompletionDate
        {
            get => _completionDate;
            set
            {
                _completionDate = value;
                OnPropertyChanged(nameof(CompletionDate));
            }
        }

        /// <summary>
        /// Current production rate (barrels per day for oil, mcf per day for gas)
        /// </summary>
        public double? ProductionRate
        {
            get => _productionRate;
            set
            {
                _productionRate = value;
                OnPropertyChanged(nameof(ProductionRate));
            }
        }

        /// <summary>
        /// Operator of the well
        /// </summary>
        public string Operator
        {
            get => _operator;
            set
            {
                _operator = value;
                OnPropertyChanged(nameof(Operator));
            }
        }

        /// <summary>
        /// Configuration of the well (e.g., Vertical, Deviated, Horizontal)
        /// </summary>
        public string Configuration { get; set; } // Vertical, Deviated, Horizontal
        /// <summary>
        /// Production history for the well (DateTime, ProductionRate)
        /// </summary>
        public Dictionary<DateTime, double> ProductionHistory { get; set; } = new Dictionary<DateTime, double>();

        /// <summary>
        /// Additional metadata for the well
        /// </summary>
        public Dictionary<string, object> Metadata { get; set; } = new Dictionary<string, object>();

        /// <summary>
        /// List of trajectory points for the well (for trajectory display)
        /// </summary>
        public List<GeoLocation> Trajectory { get; set; } = new List<GeoLocation>();

        /// <summary>
        /// Formation name for the well
        /// </summary>
        public string Formation { get; set; }

        /// <summary>
        /// Reservoir block identifier
        /// </summary>
        public string Block { get; set; }

        /// <summary>
        /// Geologic description of the well
        /// </summary>
        public string GeologicDescription { get; set; }

        /// <summary>
        /// The ID of the flow station this well pumps to
        /// </summary>
        public string FlowStationId { get; set; }

        /// <summary>
        /// The name of the flow station this well pumps to (for display)
        /// </summary>
        public string FlowStationName { get; set; }

        /// <summary>
        /// Default constructor
        /// </summary>
        public Well()
        {
            Id = Guid.NewGuid().ToString();
            Location = new GeoLocation();
            Configuration = "Vertical";
            ProductionHistory = new Dictionary<DateTime, double>();
        }

        /// <summary>
        /// Constructor with basic properties
        /// </summary>
        /// <param name="name">Well name</param>
        /// <param name="type">Well type</param>
        /// <param name="depth">Well depth in meters</param>
        /// <param name="latitude">Latitude</param>
        /// <param name="longitude">Longitude</param>
        public Well(string name, string type, double depth, double latitude, double longitude)
        {
            Id = Guid.NewGuid().ToString();
            Name = name;
            Type = type;
            Depth = depth;
            Location = new GeoLocation(latitude, longitude);
            Configuration = "Vertical";
            ProductionHistory = new Dictionary<DateTime, double>();
        }

        /// <summary>
        /// Calculates distance to another well
        /// </summary>
        /// <param name="other">Other well</param>
        /// <returns>Distance in kilometers</returns>
        public double DistanceTo(Well other)
        {
            return Location?.DistanceTo(other.Location) ?? double.MaxValue;
        }

        /// <summary>
        /// Returns a string representation of the well
        /// </summary>
        /// <returns>Well name and type</returns>
        public override string ToString()
        {
            return $"{Name} ({Type})";
        }

        public event PropertyChangedEventHandler PropertyChanged;

        protected virtual void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
} 