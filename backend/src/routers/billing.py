import stripe
from fastapi import APIRouter, Header, HTTPException, Request

from src.core.dependencies import CurrentUserDep, DbSessionDep
from src.models.billing import (
    BillingStatus,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    PlanCatalogItem,
    PortalSessionResponse,
    WebhookResponse,
)
from src.services.billing import (
    BillingConfigurationError,
    BillingConflictError,
    BillingService,
    PLAN_CATALOG,
)
from src.services.users import UserService

router = APIRouter()
_billing_service = BillingService()
_user_service = UserService()


@router.get("/plans", response_model=list[PlanCatalogItem])
async def list_plans() -> list[PlanCatalogItem]:
    return PLAN_CATALOG


@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout(
    body: CheckoutSessionRequest,
    current_user: CurrentUserDep,
    db: DbSessionDep,
) -> CheckoutSessionResponse:
    user = await _user_service.get_or_create(
        current_user.user_id, current_user.email, db
    )
    try:
        return await _billing_service.create_checkout(user, body.plan, db)
    except BillingConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except BillingConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/portal", response_model=PortalSessionResponse)
async def create_portal(
    current_user: CurrentUserDep, db: DbSessionDep
) -> PortalSessionResponse:
    try:
        return await _billing_service.create_portal(current_user.user_id, db)
    except BillingConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except BillingConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/status", response_model=BillingStatus)
async def get_billing_status(
    current_user: CurrentUserDep, db: DbSessionDep
) -> BillingStatus:
    user = await _user_service.get_or_create(
        current_user.user_id, current_user.email, db
    )
    return await _billing_service.get_status(user, db)


@router.post("/webhooks/stripe", response_model=WebhookResponse)
async def stripe_webhook(
    request: Request,
    db: DbSessionDep,
    stripe_signature: str = Header(alias="Stripe-Signature"),
) -> WebhookResponse:
    try:
        event = _billing_service.construct_event(
            await request.body(), stripe_signature
        )
    except (ValueError, stripe.SignatureVerificationError) as exc:
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook") from exc
    except BillingConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return await _billing_service.process_event(event, db)
