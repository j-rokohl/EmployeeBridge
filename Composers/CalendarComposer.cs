using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;

namespace MyUmbracoSite.Composers;

public class CalendarComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.AddNotificationHandler<ContentSavingNotification, CalendarSortHandler>();
    }
}