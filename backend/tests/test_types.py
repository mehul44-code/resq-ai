from app.services.simulation.types import ReasonCode


def test_reason_codes_have_distinct_fire_and_safe_route_members():
    assert ReasonCode.FIRE_ON_PATH.value == "FIRE_ON_PATH"
    assert ReasonCode.SAFER_ROUTE_FOUND.value == "SAFER_ROUTE_FOUND"
    assert list(ReasonCode).count(ReasonCode.FIRE_ON_PATH) == 1
    assert list(ReasonCode).count(ReasonCode.SAFER_ROUTE_FOUND) == 1
