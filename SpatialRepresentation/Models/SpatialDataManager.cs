using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace SpatialRepresentation.Models
{
    /// <summary>
    /// Manages spatial data for fields, wells, and routing operations
    /// </summary>
    public class SpatialDataManager
    {
        private List<Field> _fields;
        private List<Route> _routes;
        public List<GeoLocation> ConcessionBoundary { get; set; }

        /// <summary>
        /// Collection of all fields
        /// </summary>
        public List<Field> Fields
        {
            get => _fields;
            set => _fields = value ?? new List<Field>();
        }

        /// <summary>
        /// Collection of all routes
        /// </summary>
        public List<Route> Routes
        {
            get => _routes;
            set => _routes = value ?? new List<Route>();
        }

        /// <summary>
        /// Default constructor
        /// </summary>
        public SpatialDataManager()
        {
            Fields = new List<Field>();
            Routes = new List<Route>();
            ConcessionBoundary = new List<GeoLocation>();
        }

        /// <summary>
        /// Adds a field to the collection
        /// </summary>
        /// <param name="field">Field to add</param>
        public void AddField(Field field)
        {
            if (field != null && !Fields.Any(f => f.Id == field.Id))
            {
                Fields.Add(field);
            }
        }

        /// <summary>
        /// Removes a field from the collection
        /// </summary>
        /// <param name="fieldId">ID of the field to remove</param>
        /// <returns>True if field was removed, false otherwise</returns>
        public bool RemoveField(string fieldId)
        {
            var field = Fields.FirstOrDefault(f => f.Id == fieldId);
            if (field != null)
            {
                Fields.Remove(field);
                return true;
            }
            return false;
        }

        /// <summary>
        /// Gets a field by its ID
        /// </summary>
        /// <param name="fieldId">Field ID</param>
        /// <returns>Field or null if not found</returns>
        public Field GetField(string fieldId)
        {
            return Fields.FirstOrDefault(f => f.Id == fieldId);
        }

        /// <summary>
        /// Gets a field by its name
        /// </summary>
        /// <param name="fieldName">Field name</param>
        /// <returns>Field or null if not found</returns>
        public Field GetFieldByName(string fieldName)
        {
            return Fields.FirstOrDefault(f => string.Equals(f.FieldName, fieldName, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Gets all wells across all fields
        /// </summary>
        /// <returns>List of all wells</returns>
        public List<Well> GetAllWells()
        {
            return Fields.SelectMany(f => f.Wells).ToList();
        }

        /// <summary>
        /// Gets a well by its ID across all fields
        /// </summary>
        /// <param name="wellId">Well ID</param>
        /// <returns>Well or null if not found</returns>
        public Well GetWell(string wellId)
        {
            return GetAllWells().FirstOrDefault(w => w.Id == wellId);
        }

        /// <summary>
        /// Gets a well by its name across all fields
        /// </summary>
        /// <param name="wellName">Well name</param>
        /// <returns>Well or null if not found</returns>
        public Well GetWellByName(string wellName)
        {
            return GetAllWells().FirstOrDefault(w => string.Equals(w.Name, wellName, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Creates a route between two wells
        /// </summary>
        /// <param name="sourceWellId">Source well ID</param>
        /// <param name="destinationWellId">Destination well ID</param>
        /// <param name="routeName">Optional route name</param>
        /// <returns>Created route or null if wells not found</returns>
        public Route CreateRoute(string sourceWellId, string destinationWellId, string routeName = null)
        {
            var sourceWell = GetWell(sourceWellId);
            var destinationWell = GetWell(destinationWellId);

            if (sourceWell == null || destinationWell == null)
                return null;

            var route = new Route(sourceWell, destinationWell, routeName);
            Routes.Add(route);
            return route;
        }

        /// <summary>
        /// Gets all routes for a specific field
        /// </summary>
        /// <param name="fieldId">Field ID</param>
        /// <returns>List of routes in the field</returns>
        public List<Route> GetRoutesForField(string fieldId)
        {
            var field = GetField(fieldId);
            if (field == null) return new List<Route>();

            var fieldWellIds = field.Wells.Select(w => w.Id).ToHashSet();
            return Routes.Where(r => 
                (r.SourceWell != null && fieldWellIds.Contains(r.SourceWell.Id)) ||
                (r.DestinationWell != null && fieldWellIds.Contains(r.DestinationWell.Id))
            ).ToList();
        }

        /// <summary>
        /// Serializes the data to JSON format compatible with the JavaScript map
        /// </summary>
        /// <returns>JSON string</returns>
        public string SerializeToJson()
        {
            var settings = new JsonSerializerSettings
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver(),
                Formatting = Formatting.Indented,
                NullValueHandling = NullValueHandling.Ignore
            };

            // Structure the output to include boundary, fields, and all well/field properties
            var output = new
            {
                concessionBoundary = ConcessionBoundary?.Select(g => new { lat = g.Latitude, lng = g.Longitude }).ToList(),
                fields = Fields.Select(f => new {
                    id = f.Id,
                    name = f.FieldName,
                    location = f.Location != null ? new { lat = f.Location.Latitude, lng = f.Location.Longitude } : null,
                    operatorName = f.Operator,
                    discoveryDate = f.DiscoveryDate,
                    status = f.Status,
                    estimatedReserves = f.EstimatedReserves,
                    color = f.Color,
                    formation = f.Formation,
                    block = f.Block,
                    geologicDescription = f.GeologicDescription,
                    boeConversionRatio = f.BoeConversionRatio,
                    wells = f.Wells.Select(w => new {
                        id = w.Id,
                        name = w.Name,
                        type = w.Type,
                        depth = w.Depth,
                        location = w.Location != null ? new { lat = w.Location.Latitude, lng = w.Location.Longitude } : null,
                        status = w.Status,
                        completionDate = w.CompletionDate,
                        productionRate = w.ProductionRate,
                        operatorName = w.Operator,
                        configuration = w.Configuration,
                        productionHistory = w.ProductionHistory?.ToDictionary(ph => ph.Key.ToString("yyyy-MM-dd"), ph => ph.Value),
                        formation = w.Formation,
                        block = w.Block,
                        geologicDescription = w.GeologicDescription,
                        trajectory = w.Trajectory?.Select(t => new { lat = t.Latitude, lng = t.Longitude }).ToList(),
                        metadata = w.Metadata
                    }).ToList(),
                    metadata = f.Metadata
                }).ToList()
            };

            return JsonConvert.SerializeObject(output, settings);
        }

        /// <summary>
        /// Creates sample data for testing
        /// </summary>
        public void CreateSampleData()
        {
            // Clear existing data
            Fields.Clear();
            Routes.Clear();

            // Create sample fields
            var colorPalette = new[] { "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff", "#9a6324", "#fffac8", "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080" };

            var field1 = new Field("Niger Delta Field A", 5.5, 7.0)
            {
                Operator = "Shell Nigeria",
                Status = "Active",
                DiscoveryDate = new DateTime(1990, 5, 15),
                EstimatedReserves = 500000000, // 500 million BOE
                Color = colorPalette[0],
                Formation = "Agbada Formation",
                Block = "1-AB1",
                GeologicDescription = "Deltaic reservoir with stacked sands."
            };

            var field2 = new Field("Niger Delta Field B", 5.8, 7.2)
            {
                Operator = "ExxonMobil",
                Status = "Active",
                DiscoveryDate = new DateTime(1985, 8, 22),
                EstimatedReserves = 750000000, // 750 million BOE
                Color = colorPalette[1],
                Formation = "Akata Formation",
                Block = "E1000",
                GeologicDescription = "Deep marine turbidite reservoir."
            };

            // Add wells to Field A
            var wellA1 = new Well("Well-A-01", "Oil", 2500, 5.45, 6.95)
            {
                Status = "Active",
                CompletionDate = new DateTime(1992, 3, 10),
                ProductionRate = 1500, // barrels per day
                Operator = "Shell Nigeria",
                Trajectory = new List<GeoLocation> {
                    new GeoLocation(5.45, 6.95),
                    new GeoLocation(5.451, 6.951),
                    new GeoLocation(5.452, 6.952)
                },
                Formation = "Agbada Formation",
                Block = "1-AB1",
                GeologicDescription = "Oil producer in stacked sand."
            };
            field1.AddWell(wellA1);

            var wellA2 = new Well("Well-A-02", "Gas", 2800, 5.52, 7.02)
            {
                Status = "Active",
                CompletionDate = new DateTime(1993, 7, 15),
                ProductionRate = 25, // mcf per day
                Operator = "Shell Nigeria",
                Trajectory = new List<GeoLocation> {
                    new GeoLocation(5.52, 7.02),
                    new GeoLocation(5.521, 7.021),
                    new GeoLocation(5.522, 7.022)
                },
                Formation = "Agbada Formation",
                Block = "1-AB1",
                GeologicDescription = "Gas producer in upper sand."
            };
            field1.AddWell(wellA2);

            var wellA3 = new Well("Well-A-03", "Oil", 2200, 5.48, 7.05)
            {
                Status = "Inactive",
                CompletionDate = new DateTime(1994, 11, 8),
                ProductionRate = 0,
                Operator = "Shell Nigeria",
                Trajectory = new List<GeoLocation> {
                    new GeoLocation(5.48, 7.05),
                    new GeoLocation(5.481, 7.051),
                    new GeoLocation(5.482, 7.052)
                },
                Formation = "Agbada Formation",
                Block = "1-AB1",
                GeologicDescription = "Inactive oil well."
            };
            field1.AddWell(wellA3);

            // Add wells to Field B
            var wellB1 = new Well("Well-B-01", "Oil", 3000, 5.75, 7.15)
            {
                Status = "Active",
                CompletionDate = new DateTime(1987, 4, 12),
                ProductionRate = 2200, // barrels per day
                Operator = "ExxonMobil",
                Trajectory = new List<GeoLocation> {
                    new GeoLocation(5.75, 7.15),
                    new GeoLocation(5.751, 7.151),
                    new GeoLocation(5.752, 7.152)
                },
                Formation = "Akata Formation",
                Block = "E1000A",
                GeologicDescription = "Oil producer in deep marine sand."
            };
            field2.AddWell(wellB1);

            var wellB2 = new Well("Well-B-02", "Gas", 3200, 5.82, 7.25)
            {
                Status = "Active",
                CompletionDate = new DateTime(1988, 9, 20),
                ProductionRate = 35, // mcf per day
                Operator = "ExxonMobil",
                Trajectory = new List<GeoLocation> {
                    new GeoLocation(5.82, 7.25),
                    new GeoLocation(5.821, 7.251),
                    new GeoLocation(5.822, 7.252)
                },
                Formation = "Akata Formation",
                Block = "E1000B",
                GeologicDescription = "Gas producer in channel sand."
            };
            field2.AddWell(wellB2);

            var wellB3 = new Well("Well-B-03", "Water", 1800, 5.78, 7.18)
            {
                Status = "Active",
                CompletionDate = new DateTime(1989, 2, 14),
                ProductionRate = 500, // barrels per day
                Operator = "ExxonMobil",
                Trajectory = new List<GeoLocation> {
                    new GeoLocation(5.78, 7.18),
                    new GeoLocation(5.781, 7.181),
                    new GeoLocation(5.782, 7.182)
                },
                Formation = "Akata Formation",
                Block = "E1000X",
                GeologicDescription = "Water injector."
            };
            field2.AddWell(wellB3);

            // Add fields to manager
            AddField(field1);
            AddField(field2);

            // Create some sample routes
            var route1 = CreateRoute(
                field1.Wells[0].Id, // Well-A-01
                field1.Wells[1].Id, // Well-A-02
                "Route within Field A"
            );

            var route2 = CreateRoute(
                field1.Wells[0].Id, // Well-A-01
                field2.Wells[0].Id, // Well-B-01
                "Inter-field Route"
            );
        }

        /// <summary>
        /// Gets statistics about the spatial data
        /// </summary>
        /// <returns>Dictionary with statistics</returns>
        public Dictionary<string, object> GetStatistics()
        {
            var allWells = GetAllWells();
            var activeWells = allWells.Where(w => string.Equals(w.Status, "Active", StringComparison.OrdinalIgnoreCase)).ToList();

            return new Dictionary<string, object>
            {
                ["TotalFields"] = Fields.Count,
                ["TotalWells"] = allWells.Count,
                ["ActiveWells"] = activeWells.Count,
                ["TotalRoutes"] = Routes.Count,
                ["OilWells"] = allWells.Count(w => string.Equals(w.Type, "Oil", StringComparison.OrdinalIgnoreCase)),
                ["GasWells"] = allWells.Count(w => string.Equals(w.Type, "Gas", StringComparison.OrdinalIgnoreCase)),
                ["WaterWells"] = allWells.Count(w => string.Equals(w.Type, "Water", StringComparison.OrdinalIgnoreCase)),
                ["TotalProductionRate"] = activeWells.Where(w => w.ProductionRate.HasValue).Sum(w => w.ProductionRate.Value),
                ["AverageWellDepth"] = allWells.Any() ? allWells.Average(w => w.Depth) : 0
            };
        }
    }
} 