using System.ComponentModel.DataAnnotations;
using FinalDestinationAPI.DTOs;

namespace FinalDestinationAPI.Validation;

/// <summary>
/// Validates that a date is not in the past
/// </summary>
public class FutureDateAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
    {
        if (value is DateTime dateTime)
        {
            return dateTime.Date >= DateTime.Today;
        }
        return true; // Let Required attribute handle null values
    }

    public override string FormatErrorMessage(string name)
    {
        return $"{name} cannot be in the past.";
    }
}

/// <summary>
/// Validates that a date is after another date property
/// </summary>
public class DateAfterAttribute : ValidationAttribute
{
    private readonly string _comparisonProperty;

    public DateAfterAttribute(string comparisonProperty)
    {
        _comparisonProperty = comparisonProperty;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        var currentValue = value as DateTime?;
        var property = validationContext.ObjectType.GetProperty(_comparisonProperty);

        if (property == null)
        {
            return new ValidationResult($"Unknown property: {_comparisonProperty}");
        }

        var comparisonValue = property.GetValue(validationContext.ObjectInstance) as DateTime?;

        if (currentValue.HasValue && comparisonValue.HasValue)
        {
            if (currentValue <= comparisonValue)
            {
                return new ValidationResult(ErrorMessage ?? $"{validationContext.DisplayName} must be after {_comparisonProperty}.");
            }
        }

        return ValidationResult.Success;
    }
}

/// <summary>
/// Validates that a date range is within reasonable limits
/// </summary>
public class DateRangeAttribute : ValidationAttribute
{
    private readonly int _maxDays;

    public DateRangeAttribute(int maxDays)
    {
        _maxDays = maxDays;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (validationContext.ObjectInstance is CreateBookingRequest booking)
        {
            var days = (booking.CheckOutDate - booking.CheckInDate).Days;
            if (days > _maxDays)
            {
                return new ValidationResult($"Booking duration cannot exceed {_maxDays} days.");
            }
            if (days <= 0)
            {
                return new ValidationResult("Check-out date must be after check-in date.");
            }
        }

        return ValidationResult.Success;
    }
}

/// <summary>
/// Validates currency code format (3 uppercase letters)
/// </summary>
public class CurrencyCodeAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
    {
        if (value is string currency)
        {
            return currency.Length == 3 && currency.All(char.IsUpper) && currency.All(char.IsLetter);
        }
        return true; // Let Required attribute handle null values
    }

    public override string FormatErrorMessage(string name)
    {
        return $"{name} must be a valid 3-letter currency code (e.g., USD, EUR, GBP).";
    }
}

/// <summary>
/// Validates credit card number using Luhn algorithm
/// </summary>
public class CreditCardAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
    {
        if (value is not string cardNumber)
            return true; // Let Required attribute handle null values

        // Remove spaces and dashes
        cardNumber = cardNumber.Replace(" ", "").Replace("-", "");

        // Check if all characters are digits
        if (!cardNumber.All(char.IsDigit))
            return false;

        // Check length (13-19 digits for most cards)
        if (cardNumber.Length < 13 || cardNumber.Length > 19)
            return false;

        // Luhn algorithm validation
        return IsValidLuhn(cardNumber);
    }

    private static bool IsValidLuhn(string cardNumber)
    {
        int sum = 0;
        bool alternate = false;

        // Process digits from right to left
        for (int i = cardNumber.Length - 1; i >= 0; i--)
        {
            int digit = int.Parse(cardNumber[i].ToString());

            if (alternate)
            {
                digit *= 2;
                if (digit > 9)
                    digit = (digit % 10) + 1;
            }

            sum += digit;
            alternate = !alternate;
        }

        return sum % 10 == 0;
    }

    public override string FormatErrorMessage(string name)
    {
        return $"{name} is not a valid credit card number.";
    }
}

/// <summary>
/// Validates that expiry date is not in the past
/// </summary>
public class ExpiryDateAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (validationContext.ObjectInstance is PaymentRequest payment)
        {
            if (!string.IsNullOrEmpty(payment.ExpiryMonth) && !string.IsNullOrEmpty(payment.ExpiryYear))
            {
                if (int.TryParse(payment.ExpiryMonth, out int month) && 
                    int.TryParse(payment.ExpiryYear, out int year))
                {
                    // Assume 2-digit year, convert to 4-digit
                    if (year < 100)
                        year += 2000;

                    var expiryDate = new DateTime(year, month, 1).AddMonths(1).AddDays(-1);
                    if (expiryDate < DateTime.Today)
                    {
                        return new ValidationResult("Card has expired.");
                    }
                }
            }
        }

        return ValidationResult.Success;
    }
}




