using System;
using System.Collections.Generic;
using System.Linq;
using SpatialRepresentation.Models;
using SpatialRepresentation.Services;

namespace SpatialRepresentation.Examples
{
    /// <summary>
    /// Example class demonstrating how to use the spatial representation models and services
    /// </summary>
    public class SpatialDataExample
    {
        private SpatialDataManager _dataManager;
        private RoutingService _routingService;

        // Make wells class fields so they are accessible in all methods
        private Well well1;
        private Well well2;
        private Well well3;
        private Well well4;
        private Well well5;

        public SpatialDataExample()
        {
            _dataManager = new SpatialDataManager();
            _routingService = new RoutingService(_dataManager);
        }

        /// <summary>
        /// Demonstrates creating and managing fields and wells
        /// </summary>
        public void DemonstrateFieldAndWellManagement()
        {
            Console.WriteLine("=== Field and Well Management Demo ===");

            // Create a field
            var field = new Field("Niger Delta Field Alpha", 5.5, 7.0)
            {
                Operator = "Shell Nigeria",
                Status = "Active",
                DiscoveryDate = new DateTime(1990, 5, 15),
                EstimatedReserves = 500000000 // 500 million BOE
            };

            // Add wells to the field
            well1 = new Well("Well-Alpha-01", "Oil", 2500, 5.45, 6.95)
            {
                Status = "Active",
                CompletionDate = new DateTime(1992, 3, 10),
                ProductionRate = 1500, // barrels per day
                Operator = "Shell Nigeria"
            };

            well2 = new Well("Well-Alpha-02", "Gas", 2800, 5.52, 7.02)
            {
                Status = "Active",
                CompletionDate = new DateTime(1993, 7, 15),
                ProductionRate = 25, // mcf per day
                Operator = "Shell Nigeria"
            };

            well3 = new Well("Well-Alpha-03", "Water", 1800, 5.48, 7.05)
            {
                Status = "Inactive",
                CompletionDate = new DateTime(1994, 11, 8),
                ProductionRate = 0,
                Operator = "Shell Nigeria"
            };

            field.AddWell(well1);
            field.AddWell(well2);
            field.AddWell(well3);

            // Add field to data manager
            _dataManager.AddField(field);

            Console.WriteLine($"Created field: {field}");
            Console.WriteLine($"Field area: {field.GetFieldArea():F2} km²");
            Console.WriteLine($"Total production rate: {field.GetTotalProductionRate()} units/day");
            Console.WriteLine($"Active wells: {field.GetActiveWells().Count}");

            // Demonstrate well queries
            var oilWells = field.GetWellsByType("Oil");
            Console.WriteLine($"Oil wells: {oilWells.Count}");

            var activeWells = field.GetActiveWells();
            Console.WriteLine($"Active wells: {activeWells.Count}");
        }

        /// <summary>
        /// Demonstrates routing functionality
        /// </summary>
        public void DemonstrateRouting()
        {
            Console.WriteLine("\n=== Routing Demo ===");

            // Create a second field for inter-field routing
            var field2 = new Field("Niger Delta Field Beta", 5.8, 7.2)
            {
                Operator = "ExxonMobil",
                Status = "Active",
                DiscoveryDate = new DateTime(1985, 8, 22),
                EstimatedReserves = 750000000 // 750 million BOE
            };

            well4 = new Well("Well-Beta-01", "Oil", 3000, 5.75, 7.15)
            {
                Status = "Active",
                CompletionDate = new DateTime(1987, 4, 12),
                ProductionRate = 2200,
                Operator = "ExxonMobil"
            };

            well5 = new Well("Well-Beta-02", "Gas", 3200, 5.82, 7.25)
            {
                Status = "Active",
                CompletionDate = new DateTime(1988, 9, 20),
                ProductionRate = 35,
                Operator = "ExxonMobil"
            };

            field2.AddWell(well4);
            field2.AddWell(well5);
            _dataManager.AddField(field2);

            // Create routes
            var route1 = _routingService.FindShortestRoute(well1.Id, well2.Id, true);
            var route2 = _routingService.FindShortestRoute(well1.Id, well4.Id, false);

            Console.WriteLine($"Route 1: {route1}");
            Console.WriteLine($"  Distance: {route1.TotalDistance:F2} km");
            Console.WriteLine($"  Estimated time: {route1.EstimatedTime:F0} minutes");

            Console.WriteLine($"Route 2: {route2}");
            Console.WriteLine($"  Distance: {route2.TotalDistance:F2} km");
            Console.WriteLine($"  Estimated time: {route2.EstimatedTime:F0} minutes");

            // Find all possible routes
            var allRoutes = _routingService.FindAllRoutes(well1.Id, well4.Id, 3);
            Console.WriteLine($"\nAll possible routes between {well1.Name} and {well4.Name}:");
            foreach (var route in allRoutes)
            {
                Console.WriteLine($"  {route.Name}: {route.TotalDistance:F2} km");
            }

            // Multi-well route optimization
            var wellIds = new List<string> { well1.Id, well2.Id, well4.Id, well5.Id };
            var multiWellRoute = _routingService.FindOptimalMultiWellRoute(wellIds, well1.Id, well5.Id);
            
            Console.WriteLine($"\nMulti-well route: {multiWellRoute}");
            Console.WriteLine($"  Total distance: {multiWellRoute.TotalDistance:F2} km");
            Console.WriteLine($"  Estimated time: {multiWellRoute.EstimatedTime:F0} minutes");
        }

        /// <summary>
        /// Demonstrates spatial calculations and statistics
        /// </summary>
        public void DemonstrateSpatialCalculations()
        {
            Console.WriteLine("\n=== Spatial Calculations Demo ===");

            var allWells = _dataManager.GetAllWells();
            var allFields = _dataManager.Fields;

            // Calculate distances between wells
            Console.WriteLine("Well-to-well distances:");
            for (int i = 0; i < allWells.Count; i++)
            {
                for (int j = i + 1; j < allWells.Count; j++)
                {
                    var distance = allWells[i].DistanceTo(allWells[j]);
                    Console.WriteLine($"  {allWells[i].Name} to {allWells[j].Name}: {distance:F2} km");
                }
            }

            // Field statistics
            foreach (var field in allFields)
            {
                var bbox = field.GetBoundingBox();
                var area = field.GetFieldArea();
                var productionRate = field.GetTotalProductionRate();

                Console.WriteLine($"\nField: {field.FieldName}");
                Console.WriteLine($"  Bounding box: {bbox?.minLat:F4}, {bbox?.minLng:F4} to {bbox?.maxLat:F4}, {bbox?.maxLng:F4}");
                Console.WriteLine($"  Area: {area:F2} km²");
                Console.WriteLine($"  Production rate: {productionRate} units/day");
            }

            // Routing statistics for each field
            foreach (var field in allFields)
            {
                var routingStats = _routingService.GetFieldRoutingStatistics(field.Id);
                Console.WriteLine($"\nRouting statistics for {field.FieldName}:");
                foreach (var stat in routingStats)
                {
                    Console.WriteLine($"  {stat.Key}: {stat.Value}");
                }
            }
        }

        /// <summary>
        /// Demonstrates data serialization for the map
        /// </summary>
        public void DemonstrateDataSerialization()
        {
            Console.WriteLine("\n=== Data Serialization Demo ===");

            // Get JSON representation for the map
            var jsonData = _dataManager.SerializeToJson();
            Console.WriteLine("JSON data for map:");
            Console.WriteLine(jsonData);

            // Get overall statistics
            var stats = _dataManager.GetStatistics();
            Console.WriteLine("\nOverall statistics:");
            foreach (var stat in stats)
            {
                Console.WriteLine($"  {stat.Key}: {stat.Value}");
            }
        }

        /// <summary>
        /// Demonstrates advanced well management features
        /// </summary>
        public void DemonstrateAdvancedFeatures()
        {
            Console.WriteLine("\n=== Advanced Features Demo ===");

            // Add metadata to wells
            var well = _dataManager.GetAllWells().First();
            well.Metadata["Reservoir"] = "Agbada Formation";
            well.Metadata["API_Gravity"] = 35.2;
            well.Metadata["Completion_Type"] = "Cased Hole";
            well.Metadata["Last_Workover"] = new DateTime(2020, 6, 15);

            Console.WriteLine($"Well metadata for {well.Name}:");
            foreach (var meta in well.Metadata)
            {
                Console.WriteLine($"  {meta.Key}: {meta.Value}");
            }

            // Field metadata
            var field = _dataManager.Fields.First();
            field.Metadata["Basin"] = "Niger Delta";
            field.Metadata["Play_Type"] = "Turbidite";
            field.Metadata["Water_Depth"] = 150; // meters
            field.Metadata["License_Expiry"] = new DateTime(2035, 12, 31);

            Console.WriteLine($"\nField metadata for {field.FieldName}:");
            foreach (var meta in field.Metadata)
            {
                Console.WriteLine($"  {meta.Key}: {meta.Value}");
            }

            // Demonstrate well removal
            var wellToRemove = field.Wells.First();
            var removed = field.RemoveWell(wellToRemove.Id);
            Console.WriteLine($"\nRemoved well {wellToRemove.Name}: {removed}");
            Console.WriteLine($"Field now has {field.Wells.Count} wells");
        }

        /// <summary>
        /// Runs all demonstrations
        /// </summary>
        public void RunAllDemonstrations()
        {
            Console.WriteLine("Spatial Representation Demo");
            Console.WriteLine("==========================\n");

            DemonstrateFieldAndWellManagement();
            DemonstrateRouting();
            DemonstrateSpatialCalculations();
            DemonstrateDataSerialization();
            DemonstrateAdvancedFeatures();

            Console.WriteLine("\n=== Demo Complete ===");
        }

        /// <summary>
        /// Gets the data manager for external use
        /// </summary>
        public SpatialDataManager GetDataManager()
        {
            return _dataManager;
        }

        /// <summary>
        /// Gets the routing service for external use
        /// </summary>
        public RoutingService GetRoutingService()
        {
            return _routingService;
        }
    }
} 