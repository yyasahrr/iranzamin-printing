import logging

logger = logging.getLogger(__name__)

class BaseEvent:
    """کلاس رویداد اصلی (Base Event Class)"""
    def __init__(self, name=None, data=None):
        self.name = name or self.__class__.__name__
        self.data = data or {}
        self.timestamp = None


class EventRegistry:
    """سیستم ثبت‌نام و توزیع رویدادها (Event Dispatcher / Pub-Sub Engine)"""
    _listeners = {}

    @classmethod
    def register(cls, event_name: str, callback):
        """ثبت‌نام یک شنونده (Listener) برای یک رویداد خاص"""
        if event_name not in cls._listeners:
            cls._listeners[event_name] = []
        cls._listeners[event_name].append(callback)
        logger.info(f"Listener {callback.__name__} registered for event {event_name}")

    @classmethod
    def dispatch(cls, event: BaseEvent):
        """ارسال رویداد به تمام شنوندگان ثبت‌نام شده به صورت سنکرون/آسنکرون"""
        event_name = event.name
        logger.info(f"Dispatching event: {event_name} with data: {event.data}")
        
        if event_name in cls._listeners:
            for callback in cls._listeners[event_name]:
                try:
                    callback(event)
                except Exception as e:
                    logger.error(f"Error executing callback {callback.__name__} on event {event_name}: {str(e)}")
        else:
            logger.info(f"No listeners registered for event: {event_name}")


# نمونه رویدادهای استاندارد چاپی پلتفرم
class OrderCreated(BaseEvent): pass
class PaymentCompleted(BaseEvent): pass
class FileUploaded(BaseEvent): pass
class DesignerAssigned(BaseEvent): pass
class OrderCompleted(BaseEvent): pass
