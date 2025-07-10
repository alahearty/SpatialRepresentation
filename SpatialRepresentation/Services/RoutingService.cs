using System;
using System.Collections.Generic;
using System.Linq;
using SpatialRepresentation.Models;

namespace SpatialRepresentation.Services
{
    /// <summary>
    /// Service for handling routing operations between wells
    /// </summary>
    public class RoutingService
    {
        private readonly SpatialDataManager _dataManager;

        // Helper struct for convex hull
        private struct Point
        {
            public double Latitude { get; set; }
            public double Longitude { get; set; }
            public Point(double lat, double lng) { Latitude = lat; Longitude = lng; }
        }

        public RoutingService(SpatialDataManager dataManager)
        {
            _dataManager = dataManager ?? throw new ArgumentNullException(nameof(dataManager));
        }

        /// <summary>
        /// Finds the shortest route between two wells
        /// </summary>
        /// <param name="sourceWellId">Source well ID</param>
        /// <param name="destinationWellId">Destination well ID</param>
        /// <param name="includeWaypoints">Whether to include intermediate waypoints</param>
        /// <returns>Optimized route</returns>
        public Route FindShortestRoute(string sourceWellId, string destinationWellId, bool includeWaypoints = false)
        {
            var sourceWell = _dataManager.GetWell(sourceWellId);
            var destinationWell = _dataManager.GetWell(destinationWellId);

            if (sourceWell == null || destinationWell == null)
                return null;

            var route = new Route(sourceWell, destinationWell);
            
            if (includeWaypoints)
            {
                // Find intermediate wells that could serve as waypoints
                var intermediateWells = FindIntermediateWells(sourceWell, destinationWell);
                foreach (var well in intermediateWells)
                {
                    route.AddWaypoint(well.Location);
                }
            }

            // Calculate route metrics
            route.TotalDistance = CalculateRouteDistance(route);
            route.EstimatedTime = EstimateTravelTime(route.TotalDistance ?? 0);
            route.RouteType = "Driving"; // Default route type

            return route;
        }

        /// <summary>
        /// Finds all possible routes between two wells
        /// </summary>
        /// <param name="sourceWellId">Source well ID</param>
        /// <param name="destinationWellId">Destination well ID</param>
        /// <param name="maxRoutes">Maximum number of routes to return</param>
        /// <returns>List of possible routes</returns>
        public List<Route> FindAllRoutes(string sourceWellId, string destinationWellId, int maxRoutes = 5)
        {
            var sourceWell = _dataManager.GetWell(sourceWellId);
            var destinationWell = _dataManager.GetWell(destinationWellId);

            if (sourceWell == null || destinationWell == null)
                return new List<Route>();

            var routes = new List<Route>();

            // Direct route
            var directRoute = new Route(sourceWell, destinationWell, "Direct Route");
            directRoute.TotalDistance = sourceWell.Location.DistanceTo(destinationWell.Location);
            directRoute.EstimatedTime = EstimateTravelTime(directRoute.TotalDistance ?? 0);
            routes.Add(directRoute);

            // Routes with intermediate wells
            var intermediateWells = FindIntermediateWells(sourceWell, destinationWell);
            var routeCount = 1;

            foreach (var intermediateWell in intermediateWells.Take(maxRoutes - 1))
            {
                var route = new Route(sourceWell, destinationWell, $"Route via {intermediateWell.Name}");
                route.AddWaypoint(intermediateWell.Location);
                route.TotalDistance = CalculateRouteDistance(route);
                route.EstimatedTime = EstimateTravelTime(route.TotalDistance ?? 0);
                routes.Add(route);
                routeCount++;

                if (routeCount >= maxRoutes) break;
            }

            return routes.OrderBy(r => r.TotalDistance).ToList();
        }

        /// <summary>
        /// Finds the optimal route visiting multiple wells
        /// </summary>
        /// <param name="wellIds">List of well IDs to visit</param>
        /// <param name="startWellId">Starting well ID</param>
        /// <param name="endWellId">Ending well ID (optional)</param>
        /// <returns>Optimized route visiting all wells</returns>
        public Route FindOptimalMultiWellRoute(List<string> wellIds, string startWellId, string endWellId = null)
        {
            if (wellIds == null || wellIds.Count < 2)
                return null;

            var wells = wellIds.Select(id => _dataManager.GetWell(id)).Where(w => w != null).ToList();
            if (wells.Count < 2) return null;

            var startWell = _dataManager.GetWell(startWellId);
            var endWell = endWellId != null ? _dataManager.GetWell(endWellId) : startWell;

            if (startWell == null) return null;

            // Simple nearest neighbor algorithm for TSP
            var route = new Route(startWell, endWell, "Multi-well Route");
            var unvisitedWells = new List<Well>(wells.Where(w => w.Id != startWell.Id && w.Id != endWell?.Id));
            var currentWell = startWell;

            while (unvisitedWells.Any())
            {
                var nearestWell = FindNearestWell(currentWell, unvisitedWells);
                if (nearestWell != null)
                {
                    route.AddWaypoint(nearestWell.Location);
                    unvisitedWells.Remove(nearestWell);
                    currentWell = nearestWell;
                }
                else
                {
                    break;
                }
            }

            route.TotalDistance = CalculateRouteDistance(route);
            route.EstimatedTime = EstimateTravelTime(route.TotalDistance ?? 0);

            return route;
        }

        /// <summary>
        /// Calculates the total distance of a route
        /// </summary>
        /// <param name="route">Route to calculate distance for</param>
        /// <returns>Total distance in kilometers</returns>
        public double CalculateRouteDistance(Route route)
        {
            if (route == null) return 0;

            var waypoints = route.GetAllWaypoints();
            if (waypoints.Count < 2) return 0;

            double totalDistance = 0;
            for (int i = 0; i < waypoints.Count - 1; i++)
            {
                totalDistance += waypoints[i].DistanceTo(waypoints[i + 1]);
            }

            return totalDistance;
        }

        /// <summary>
        /// Estimates travel time for a given distance
        /// </summary>
        /// <param name="distanceKm">Distance in kilometers</param>
        /// <param name="averageSpeedKmh">Average speed in km/h</param>
        /// <returns>Estimated travel time in minutes</returns>
        public double EstimateTravelTime(double distanceKm, double averageSpeedKmh = 60)
        {
            if (distanceKm <= 0 || averageSpeedKmh <= 0) return 0;
            return (distanceKm / averageSpeedKmh) * 60; // Convert to minutes
        }

        /// <summary>
        /// Finds intermediate wells that could serve as waypoints
        /// </summary>
        /// <param name="sourceWell">Source well</param>
        /// <param name="destinationWell">Destination well</param>
        /// <param name="maxDistance">Maximum distance for intermediate wells</param>
        /// <returns>List of intermediate wells</returns>
        private List<Well> FindIntermediateWells(Well sourceWell, Well destinationWell, double maxDistance = 50)
        {
            if (sourceWell?.Location == null || destinationWell?.Location == null)
                return new List<Well>();

            var allWells = _dataManager.GetAllWells();
            var intermediateWells = new List<Well>();

            // Calculate the direct route line
            var directDistance = sourceWell.Location.DistanceTo(destinationWell.Location);
            if (directDistance == 0) return intermediateWells;

            foreach (var well in allWells)
            {
                if (well.Id == sourceWell.Id || well.Id == destinationWell.Id || well.Location == null)
                    continue;

                // Check if well is within reasonable distance of the direct route
                var distanceToSource = well.Location.DistanceTo(sourceWell.Location);
                var distanceToDestination = well.Location.DistanceTo(destinationWell.Location);
                var totalViaWell = distanceToSource + distanceToDestination;

                // Well is a good intermediate point if it doesn't add too much distance
                if (totalViaWell <= directDistance * 1.5 && distanceToSource <= maxDistance && distanceToDestination <= maxDistance)
                {
                    intermediateWells.Add(well);
                }
            }

            // Sort by how much extra distance they add
            return intermediateWells
                .OrderBy(w => w.Location.DistanceTo(sourceWell.Location) + w.Location.DistanceTo(destinationWell.Location) - directDistance)
                .ToList();
        }

        /// <summary>
        /// Finds the nearest well to a given well
        /// </summary>
        /// <param name="referenceWell">Reference well</param>
        /// <param name="candidateWells">List of candidate wells</param>
        /// <returns>Nearest well or null</returns>
        private Well FindNearestWell(Well referenceWell, List<Well> candidateWells)
        {
            if (referenceWell?.Location == null || candidateWells == null || !candidateWells.Any())
                return null;

            return candidateWells
                .Where(w => w.Location != null)
                .OrderBy(w => referenceWell.Location.DistanceTo(w.Location))
                .FirstOrDefault();
        }

        /// <summary>
        /// Gets routing statistics for a field
        /// </summary>
        /// <param name="fieldId">Field ID</param>
        /// <returns>Routing statistics</returns>
        public Dictionary<string, object> GetFieldRoutingStatistics(string fieldId)
        {
            var field = _dataManager.GetField(fieldId);
            if (field == null) return new Dictionary<string, object>();

            var wells = field.Wells;
            if (wells.Count < 2) return new Dictionary<string, object>();

            var distances = new List<double>();
            for (int i = 0; i < wells.Count; i++)
            {
                for (int j = i + 1; j < wells.Count; j++)
                {
                    if (wells[i].Location != null && wells[j].Location != null)
                    {
                        distances.Add(wells[i].Location.DistanceTo(wells[j].Location));
                    }
                }
            }

            return new Dictionary<string, object>
            {
                ["TotalPossibleRoutes"] = distances.Count,
                ["AverageWellDistance"] = distances.Any() ? distances.Average() : 0,
                ["MinWellDistance"] = distances.Any() ? distances.Min() : 0,
                ["MaxWellDistance"] = distances.Any() ? distances.Max() : 0,
                ["TotalFieldPerimeter"] = CalculateFieldPerimeter(field)
            };
        }

        /// <summary>
        /// Calculates the approximate perimeter of a field
        /// </summary>
        /// <param name="field">Field to calculate perimeter for</param>
        /// <returns>Perimeter in kilometers</returns>
        private double CalculateFieldPerimeter(Field field)
        {
            var wells = field.Wells.Where(w => w.Location != null).ToList();
            if (wells.Count < 3) return 0;

            // Use Point struct for convex hull
            var points = wells.Select(w => new Point(w.Location.Latitude, w.Location.Longitude)).ToList();
            var hull = ComputeConvexHull(points);

            if (hull.Count < 3) return 0;

            double perimeter = 0;
            for (int i = 0; i < hull.Count; i++)
            {
                var current = hull[i];
                var next = hull[(i + 1) % hull.Count];
                
                var lat1 = current.Latitude * Math.PI / 180;
                var lng1 = current.Longitude * Math.PI / 180;
                var lat2 = next.Latitude * Math.PI / 180;
                var lng2 = next.Longitude * Math.PI / 180;

                var dLat = lat2 - lat1;
                var dLng = lng2 - lng1;

                var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                        Math.Cos(lat1) * Math.Cos(lat2) *
                        Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

                var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
                perimeter += 6371 * c; // Earth radius in km
            }

            return perimeter;
        }

        /// <summary>
        /// Computes convex hull using Graham scan algorithm
        /// </summary>
        /// <param name="points">List of points</param>
        /// <returns>Convex hull points</returns>
        private List<Point> ComputeConvexHull(List<Point> points)
        {
            if (points.Count < 3) return points;

            // Find the point with the lowest y-coordinate (and leftmost if tied)
            var start = points.OrderBy(p => p.Latitude).ThenBy(p => p.Longitude).First();

            // Sort points by polar angle with respect to start point
            var sortedPoints = points.Where(p => !p.Equals(start))
                .OrderBy(p => Math.Atan2(p.Latitude - start.Latitude, p.Longitude - start.Longitude))
                .ToList();

            var hull = new List<Point> { start };
            hull.AddRange(sortedPoints);

            // Graham scan
            var stack = new List<Point> { hull[0], hull[1] };
            for (int i = 2; i < hull.Count; i++)
            {
                while (stack.Count > 1 && !IsLeftTurn(stack[stack.Count - 2], stack[stack.Count - 1], hull[i]))
                {
                    stack.RemoveAt(stack.Count - 1);
                }
                stack.Add(hull[i]);
            }

            return stack;
        }

        /// <summary>
        /// Determines if three points make a left turn
        /// </summary>
        /// <param name="p1">First point</param>
        /// <param name="p2">Second point</param>
        /// <param name="p3">Third point</param>
        /// <returns>True if left turn</returns>
        private bool IsLeftTurn(Point p1, Point p2, Point p3)
        {
            var cross = (p2.Latitude - p1.Latitude) * (p3.Longitude - p1.Longitude) -
                       (p2.Longitude - p1.Longitude) * (p3.Latitude - p1.Latitude);
            return cross > 0;
        }
    }
} 