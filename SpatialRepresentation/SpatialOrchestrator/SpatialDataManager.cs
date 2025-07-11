using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace SpatialRepresentation.Models
{
    /// <summary>
    /// Manages spatial data for fields, wells, flow stations, and routing operations
    /// </summary>
    public class SpatialDataManager
    {
        private List<Field> _fields;
        private List<Route> _routes;
        private List<FlowStation> _flowStations;
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
        /// Collection of all flow stations
        /// </summary>
        public List<FlowStation> FlowStations
        {
            get => _flowStations;
            set => _flowStations = value ?? new List<FlowStation>();
        }

        /// <summary>
        /// Default constructor
        /// </summary>
        public SpatialDataManager()
        {
            Fields = new List<Field>();
            Routes = new List<Route>();
            FlowStations = new List<FlowStation>();
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
        /// Adds a flow station to the collection
        /// </summary>
        /// <param name="flowStation">Flow station to add</param>
        public void AddFlowStation(FlowStation flowStation)
        {
            if (flowStation != null && !FlowStations.Any(fs => fs.Id == flowStation.Id))
            {
                FlowStations.Add(flowStation);
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
        /// Gets a flow station by its ID
        /// </summary>
        /// <param name="flowStationId">Flow station ID</param>
        /// <returns>Flow station or null if not found</returns>
        public FlowStation GetFlowStation(string flowStationId)
        {
            return FlowStations.FirstOrDefault(fs => fs.Id == flowStationId);
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

            // Structure the output to include boundary, fields, flow stations, and all well/field properties
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
                        flowStationId = w.FlowStationId,
                        flowStationName = w.FlowStationName,
                        metadata = w.Metadata
                    }).ToList(),
                    metadata = f.Metadata
                }).ToList(),
                flowStations = FlowStations.Select(fs => new {
                    id = fs.Id,
                    name = fs.Name,
                    location = fs.Location != null ? new { lat = fs.Location.Latitude, lng = fs.Location.Longitude } : null
                }).ToList()
            };

            return JsonConvert.SerializeObject(output, settings);
        }

        /// <summary>
        /// Creates large sample data for testing
        /// </summary>
        public void CreateSampleData()
        {
            // Clear existing data
            Fields.Clear();
            Routes.Clear();
            FlowStations.Clear();

            // Create sample flow stations first
            var flowStation1 = new FlowStation("Flow Station Alpha", 5.55, 7.05);
            var flowStation2 = new FlowStation("Flow Station Beta", 5.35, 6.25);
            var flowStation3 = new FlowStation("Flow Station Gamma", 5.95, 6.45);
            var flowStation4 = new FlowStation("Flow Station Delta", 5.25, 6.85);
            var flowStation5 = new FlowStation("Flow Station Echo", 5.75, 7.35);

            AddFlowStation(flowStation1);
            AddFlowStation(flowStation2);
            AddFlowStation(flowStation3);
            AddFlowStation(flowStation4);
            AddFlowStation(flowStation5);

            // Create sample fields with large datasets
            var colorPalette = new[] { "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff", "#9a6324", "#fffac8", "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080" };

            // Field 1: Niger Delta Field A
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

            // Add 15 wells to Field A
            for (int i = 1; i <= 15; i++)
            {
                var well = new Well($"Well-A-{i:D2}", i % 3 == 0 ? "Gas" : "Oil", 2000 + (i * 100), 5.45 + (i * 0.01), 6.95 + (i * 0.01))
                {
                    Status = i % 4 == 0 ? "Inactive" : "Active",
                    CompletionDate = new DateTime(1992 + (i % 5), (i % 12) + 1, (i % 28) + 1),
                    ProductionRate = i % 4 == 0 ? 0 : 1000 + (i * 50),
                    Operator = "Shell Nigeria",
                    Formation = "Agbada Formation",
                    Block = "1-AB1",
                    GeologicDescription = $"Well {i} in stacked sand.",
                    FlowStationId = flowStation1.Id,
                    FlowStationName = flowStation1.Name
                };
                field1.AddWell(well);
            }

            // Field 2: Niger Delta Field B
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

            // Add 12 wells to Field B
            for (int i = 1; i <= 12; i++)
            {
                var well = new Well($"Well-B-{i:D2}", i % 2 == 0 ? "Oil" : "Gas", 2500 + (i * 150), 5.75 + (i * 0.015), 7.15 + (i * 0.015))
                {
                    Status = i % 5 == 0 ? "Inactive" : "Active",
                    CompletionDate = new DateTime(1987 + (i % 8), (i % 12) + 1, (i % 28) + 1),
                    ProductionRate = i % 5 == 0 ? 0 : 1200 + (i * 75),
                    Operator = "ExxonMobil",
                    Formation = "Akata Formation",
                    Block = "E1000",
                    GeologicDescription = $"Well {i} in deep marine sand.",
                    FlowStationId = flowStation2.Id,
                    FlowStationName = flowStation2.Name
                };
                field2.AddWell(well);
            }

            // Field 3: Niger Delta Field C
            var field3 = new Field("Niger Delta Field C", 5.3, 6.8)
            {
                Operator = "Chevron Nigeria",
                Status = "Active",
                DiscoveryDate = new DateTime(1995, 3, 10),
                EstimatedReserves = 300000000, // 300 million BOE
                Color = colorPalette[2],
                Formation = "Benin Formation",
                Block = "2-AB2",
                GeologicDescription = "Shallow marine reservoir."
            };

            // Add 10 wells to Field C
            for (int i = 1; i <= 10; i++)
            {
                var well = new Well($"Well-C-{i:D2}", i % 3 == 0 ? "Water" : "Oil", 1800 + (i * 80), 5.25 + (i * 0.02), 6.75 + (i * 0.02))
                {
                    Status = i % 6 == 0 ? "Inactive" : "Active",
                    CompletionDate = new DateTime(1996 + (i % 6), (i % 12) + 1, (i % 28) + 1),
                    ProductionRate = i % 6 == 0 ? 0 : 800 + (i * 60),
                    Operator = "Chevron Nigeria",
                    Formation = "Benin Formation",
                    Block = "2-AB2",
                    GeologicDescription = $"Well {i} in shallow marine sand.",
                    FlowStationId = flowStation3.Id,
                    FlowStationName = flowStation3.Name
                };
                field3.AddWell(well);
            }

            // Field 4: Niger Delta Field D
            var field4 = new Field("Niger Delta Field D", 5.6, 6.9)
            {
                Operator = "Total Nigeria",
                Status = "Active",
                DiscoveryDate = new DateTime(2000, 7, 5),
                EstimatedReserves = 400000000, // 400 million BOE
                Color = colorPalette[3],
                Formation = "Agbada Formation",
                Block = "3-AB3",
                GeologicDescription = "Deltaic reservoir with complex faulting."
            };

            // Add 8 wells to Field D
            for (int i = 1; i <= 8; i++)
            {
                var well = new Well($"Well-D-{i:D2}", i % 2 == 0 ? "Gas" : "Oil", 2200 + (i * 120), 5.55 + (i * 0.025), 6.85 + (i * 0.025))
                {
                    Status = i % 7 == 0 ? "Inactive" : "Active",
                    CompletionDate = new DateTime(2001 + (i % 7), (i % 12) + 1, (i % 28) + 1),
                    ProductionRate = i % 7 == 0 ? 0 : 900 + (i * 70),
                    Operator = "Total Nigeria",
                    Formation = "Agbada Formation",
                    Block = "3-AB3",
                    GeologicDescription = $"Well {i} in complex faulted reservoir.",
                    FlowStationId = flowStation4.Id,
                    FlowStationName = flowStation4.Name
                };
                field4.AddWell(well);
            }

            // Field 5: Niger Delta Field E
            var field5 = new Field("Niger Delta Field E", 5.7, 7.3)
            {
                Operator = "Eni Nigeria",
                Status = "Active",
                DiscoveryDate = new DateTime(2005, 11, 20),
                EstimatedReserves = 600000000, // 600 million BOE
                Color = colorPalette[4],
                Formation = "Akata Formation",
                Block = "4-AB4",
                GeologicDescription = "Deep marine turbidite with high pressure."
            };

            // Add 6 wells to Field E
            for (int i = 1; i <= 6; i++)
            {
                var well = new Well($"Well-E-{i:D2}", i % 3 == 0 ? "Gas" : "Oil", 2800 + (i * 200), 5.65 + (i * 0.03), 7.25 + (i * 0.03))
                {
                    Status = i % 8 == 0 ? "Inactive" : "Active",
                    CompletionDate = new DateTime(2006 + (i % 8), (i % 12) + 1, (i % 28) + 1),
                    ProductionRate = i % 8 == 0 ? 0 : 1500 + (i * 100),
                    Operator = "Eni Nigeria",
                    Formation = "Akata Formation",
                    Block = "4-AB4",
                    GeologicDescription = $"Well {i} in high pressure reservoir.",
                    FlowStationId = flowStation5.Id,
                    FlowStationName = flowStation5.Name
                };
                field5.AddWell(well);
            }

            // Add all fields to manager
            AddField(field1);
            AddField(field2);
            AddField(field3);
            AddField(field4);
            AddField(field5);

            // Create some sample routes between wells
            var allWells = GetAllWells().Where(w => w.Status == "Active").ToList();
            var random = new Random(42); // Fixed seed for reproducible results

            // Create 20 random routes between active wells
            for (int i = 0; i < 20; i++)
            {
                var sourceWell = allWells[random.Next(allWells.Count)];
                var destWell = allWells[random.Next(allWells.Count)];
                
                if (sourceWell.Id != destWell.Id)
                {
                    var route = CreateRoute(
                        sourceWell.Id,
                        destWell.Id,
                        $"Route {i + 1}: {sourceWell.Name} to {destWell.Name}"
                    );
                }
            }
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
                ["TotalFlowStations"] = FlowStations.Count,
                ["OilWells"] = allWells.Count(w => string.Equals(w.Type, "Oil", StringComparison.OrdinalIgnoreCase)),
                ["GasWells"] = allWells.Count(w => string.Equals(w.Type, "Gas", StringComparison.OrdinalIgnoreCase)),
                ["WaterWells"] = allWells.Count(w => string.Equals(w.Type, "Water", StringComparison.OrdinalIgnoreCase)),
                ["TotalProductionRate"] = activeWells.Where(w => w.ProductionRate.HasValue).Sum(w => w.ProductionRate.Value),
                ["AverageWellDepth"] = allWells.Any() ? allWells.Average(w => w.Depth) : 0
            };
        }
    }
} 