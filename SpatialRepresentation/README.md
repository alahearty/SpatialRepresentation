# Spatial Representation of Wells and Fields

A C# WPF application for spatial representation of oil and gas wells with routing support using Leaflet maps.

## Features

- **Spatial Data Models**: Complete models for fields, wells, and routing
- **Interactive Map**: Leaflet-based visualization with WebView2
- **Routing Engine**: Route calculation between wells with optimization
- **Data Management**: Comprehensive data management with statistics

## Project Structure

```
Models/
├── GeoLocation.cs         # Geographical coordinates
├── Well.cs                # Well representation  
├── Field.cs               # Field representation
├── Route.cs               # Routing information
└── SpatialDataManager.cs  # Data management

Services/
└── RoutingService.cs      # Routing operations

Examples/
└── SpatialDataExample.cs  # Usage examples
```

## Quick Start

```csharp
// Initialize
var dataManager = new SpatialDataManager();
var routingService = new RoutingService(dataManager);

// Create sample data
dataManager.CreateSampleData();

// Create a field with wells
var field = new Field("Niger Delta Field", 5.5, 7.0);
var well = new Well("Well-001", "Oil", 2500, 5.45, 6.95);
field.AddWell(well);
dataManager.AddField(field);

// Create a route
var route = routingService.FindShortestRoute(well1.Id, well2.Id);

// Serialize for map
string jsonData = dataManager.SerializeToJson();
```

## Running the Application

1. Build and run the WPF application
2. Click "Load Sample Data" to populate the map
3. Use field selector to filter data
4. Create routes between wells using the routing controls

## Key Models

### GeoLocation
```csharp
var location = new GeoLocation(5.5, 7.0);
double distance = location.DistanceTo(otherLocation);
```

### Well
```csharp
var well = new Well("Well-001", "Oil", 2500, 5.45, 6.95)
{
    Status = "Active",
    ProductionRate = 1500
};
```

### Field
```csharp
var field = new Field("Field Name", 5.5, 7.0);
field.AddWell(well);
double area = field.GetFieldArea();
```

### Route
```csharp
var route = new Route(sourceWell, destinationWell);
route.TotalDistance = routingService.CalculateRouteDistance(route);
```

## Map Integration

The application uses WebView2 with Leaflet for map visualization. Data is serialized to JSON and passed to the JavaScript map.

## Requirements

- .NET Framework 4.8
- Microsoft WebView2 Runtime
- Visual Studio 2019+

## License

MIT License 