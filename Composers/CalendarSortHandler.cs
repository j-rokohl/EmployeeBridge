using System;
using System.Text.Json;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;

namespace MyUmbracoSite.Composers;

public class CalendarSortHandler : INotificationHandler<ContentSavingNotification>
{
    public void Handle(ContentSavingNotification notification)
    {
        var today = DateTime.Today;

        foreach (var node in notification.SavedEntities)
        {
            if (!node.ContentType.Alias.Equals("calendarItemPage", StringComparison.OrdinalIgnoreCase))
                continue;

            var prop = node.Properties["eventDate"];
            var rawVal = prop?.GetValue();

            var extractedDate = ParseUmbracoDateTime(rawVal);

            if (extractedDate.HasValue)
            {
                int newRank = CalculateSortRank(extractedDate.Value, today);
                node.SortOrder = newRank;
            }
            else
            {
                node.SortOrder = 0;
            }
        }
    }

    private static DateTime? ParseUmbracoDateTime(object? raw)
    {
        if (raw == null) return null;

        // 1. Direct DateTime object
        if (raw is DateTime dt) return dt;

        string strVal = raw.ToString()?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(strVal)) return null;

        // 2. Direct ISO-8601 string parsing
        if (DateTime.TryParse(strVal, out var parsedDate))
        {
            if (parsedDate > DateTime.MinValue && parsedDate < DateTime.MaxValue)
                return parsedDate;
        }

        // 3. Bellissima DateTimePicker JSON Object {"date":"2026-10-03T10:40:00+00:00", ...}
        try
        {
            using var doc = JsonDocument.Parse(strVal);
            if (doc.RootElement.ValueKind == JsonValueKind.Object)
            {
                // Bellissima stores ISO string under "date"
                if (doc.RootElement.TryGetProperty("date", out var dateProp))
                {
                    if (DateTime.TryParse(dateProp.GetString(), out var jsonDate))
                        return jsonDate;
                }
                // Fallback for older "value" payload formats
                else if (doc.RootElement.TryGetProperty("value", out var valProp))
                {
                    if (DateTime.TryParse(valProp.GetString(), out var jsonDate))
                        return jsonDate;
                }
            }
            else if (doc.RootElement.ValueKind == JsonValueKind.String)
            {
                if (DateTime.TryParse(doc.RootElement.GetString(), out var jsonDate))
                    return jsonDate;
            }
        }
        catch
        {
            // Ignore JSON parse errors
        }

        return null;
    }

    private static int CalculateSortRank(DateTime eventDate, DateTime today)
    {
        int dayOffset = (eventDate.Date - today).Days;

        if (dayOffset >= 0)
        {
            // FUTURE / TODAY EVENTS (Rank Range: 0 to 499,999)
            int clampedDays = Math.Min(dayOffset, 400000);
            return (clampedDays * 100) + eventDate.Hour;
        }
        else
        {
            // PAST EVENTS (Rank Range: 500,000+)
            int pastDays = Math.Abs(dayOffset);
            int clampedPastDays = Math.Min(pastDays, 400000);
            return 500000 + (clampedPastDays * 100) + eventDate.Hour;
        }
    }
}