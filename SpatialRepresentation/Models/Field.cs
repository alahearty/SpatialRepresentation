using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;

namespace SpatialRepresentation.Models
{
    /// <summary>
    /// Represents an oil and gas field containing multiple wells
    /// </summary>
    public class Field : INotifyPropertyChanged
    {
        private string _fieldName;
        private GeoLocation _location;
        private string _operator;
        private DateTime? _discoveryDate;
        private string _status;
        private double? _estimatedReserves;
        private List<Well> _wells;

        /// <summary>
        /// Unique identifier for the field
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Name of the field
        /// </summary>
        public string FieldName
        {
            get => _fieldName;
            set
            {
                _fieldName = value;
                OnPropertyChanged(nameof(FieldName));
            }
        }

        /// <summary>
        /// Geographical location of the field (typically center point)
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
        /// Operator of the field
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
        /// Date when the field was discovered
        /// </summary>
        public DateTime? DiscoveryDate
        {
            get => _discoveryDate;
            set
            {
                _discoveryDate = value;
                OnPropertyChanged(nameof(DiscoveryDate));
            }
        }

        /// <summary>
        /// Current status of the field (e.g., "Active", "Inactive", "Abandoned")
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
        /// Estimated reserves in barrels of oil equivalent (BOE)
        /// </summary>
        public double? EstimatedReserves
        {
            get => _estimatedReserves;
            set
            {
                _estimatedReserves = value;
                OnPropertyChanged(nameof(EstimatedReserves));
            }
        }

        /// <summary>
        /// List of wells in this field
        /// </summary>
        public List<Well> Wells
        {
            get => _wells;
            set
            {
                _wells = value;
                OnPropertyChanged(nameof(Wells));
            }
        }

        /// <summary>
        /// Additional metadata for the field
        /// </summary>
        public Dictionary<string, object> Metadata { get; set; } = new Dictionary<string, object>();

        /// <summary>
        /// Color for the field (used for map visualization)
        /// </summary>
        public string Color { get; set; }

        /// <summary>
        /// Formation name for the field
        /// </summary>
        public string Formation { get; set; }

        /// <summary>
        /// Reservoir block identifier
        /// </summary>
        public string Block { get; set; }

        /// <summary>
        /// Geologic description of the field
        /// </summary>
        public string GeologicDescription { get; set; }

        /// <summary>
        /// BOE conversion ratio for the field
        /// </summary>
        public double BoeConversionRatio { get; set; } // e.g., 1 for oil, 0.178 for gas, etc.

        /// <summary>
        /// Default constructor
        /// </summary>
        public Field()
        {
            Id = Guid.NewGuid().ToString();
            Location = new GeoLocation();
            Wells = new List<Well>();
            BoeConversionRatio = 1.0;
        }

        /// <summary>
        /// Constructor with basic properties
        /// </summary>
        /// <param name="fieldName">Field name</param>
        /// <param name="latitude">Latitude</param>
        /// <param name="longitude">Longitude</param>
        public Field(string fieldName, double latitude, double longitude)
        {
            Id = Guid.NewGuid().ToString();
            FieldName = fieldName;
            Location = new GeoLocation(latitude, longitude);
            Wells = new List<Well>();
            BoeConversionRatio = 1.0;
        }

        /// <summary>
        /// Adds a well to the field
        /// </summary>
        /// <param name="well">Well to add</param>
        public void AddWell(Well well)
        {
            if (well != null && !Wells.Any(w => w.Id == well.Id))
            {
                Wells.Add(well);
                OnPropertyChanged(nameof(Wells));
            }
        }

        /// <summary>
        /// Removes a well from the field
        /// </summary>
        /// <param name="wellId">ID of the well to remove</param>
        /// <returns>True if well was removed, false otherwise</returns>
        public bool RemoveWell(string wellId)
        {
            var well = Wells.FirstOrDefault(w => w.Id == wellId);
            if (well != null)
            {
                Wells.Remove(well);
                OnPropertyChanged(nameof(Wells));
                return true;
            }
            return false;
        }

        /// <summary>
        /// Gets wells of a specific type
        /// </summary>
        /// <param name="type">Well type to filter by</param>
        /// <returns>List of wells of the specified type</returns>
        public List<Well> GetWellsByType(string type)
        {
            return Wells.Where(w => string.Equals(w.Type, type, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        /// <summary>
        /// Gets active wells in the field
        /// </summary>
        /// <returns>List of active wells</returns>
        public List<Well> GetActiveWells()
        {
            return Wells.Where(w => string.Equals(w.Status, "Active", StringComparison.OrdinalIgnoreCase)).ToList();
        }

        /// <summary>
        /// Calculates the total production rate for the field
        /// </summary>
        /// <returns>Total production rate or null if no wells have production data</returns>
        public double? GetTotalProductionRate()
        {
            var activeWells = GetActiveWells();
            if (!activeWells.Any()) return null;

            return activeWells.Where(w => w.ProductionRate.HasValue).Sum(w => w.ProductionRate.Value);
        }

        /// <summary>
        /// Calculates the bounding box of the field based on well locations
        /// </summary>
        /// <returns>Bounding box as (minLat, minLng, maxLat, maxLng) or null if no wells</returns>
        public (double minLat, double minLng, double maxLat, double maxLng)? GetBoundingBox()
        {
            if (!Wells.Any() || !Wells.All(w => w.Location != null)) return null;

            var lats = Wells.Select(w => w.Location.Latitude);
            var lngs = Wells.Select(w => w.Location.Longitude);

            return (lats.Min(), lngs.Min(), lats.Max(), lngs.Max());
        }

        /// <summary>
        /// Calculates the area of the field using convex hull of well locations
        /// </summary>
        /// <returns>Area in square kilometers or null if insufficient wells</returns>
        public double? GetFieldArea()
        {
            if (Wells.Count < 3) return null;

            // Simple approximation using bounding box area
            var bbox = GetBoundingBox();
            if (!bbox.HasValue) return null;

            var (minLat, minLng, maxLat, maxLng) = bbox.Value;
            var latDiff = maxLat - minLat;
            var lngDiff = maxLng - minLng;

            // Approximate area calculation (this is a rough estimate)
            // For more accurate results, you'd need to implement proper convex hull calculation
            return latDiff * lngDiff * 111.32 * 111.32; // Rough conversion to km²
        }

        /// <summary>
        /// Returns a string representation of the field
        /// </summary>
        /// <returns>Field name and well count</returns>
        public override string ToString()
        {
            return $"{FieldName} ({Wells.Count} wells)";
        }

        public event PropertyChangedEventHandler PropertyChanged;

        protected virtual void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
} 