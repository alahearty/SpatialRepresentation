using Notifications.Wpf.Annotations;
using SpatialRepresentation.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SpatialRepresentation.Models
{
    public class Asset
    {
        public int Id { get; set; }
        public string AssetName { get; set; } = string.Empty;
        public AssetType AssetType { get; set; }
        public IList<Field> Fields { get; set; } = new List<Field>();
        public string Description { get; set; }
    }
}
