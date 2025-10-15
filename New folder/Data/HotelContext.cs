using Microsoft.EntityFrameworkCore;
using FinalDestinationAPI.Models;

namespace FinalDestinationAPI.Data;

public class HotelContext : DbContext
{
    public HotelContext(DbContextOptions<HotelContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Hotel> Hotels { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<LoyaltyAccount> LoyaltyAccounts { get; set; }
    public DbSet<PointsTransaction> PointsTransactions { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<HotelManagerApplication> HotelManagerApplications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User Configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.ContactNumber).HasMaxLength(20);
            entity.Property(e => e.Role).HasConversion<int>();
        });
        
        // Hotel Configuration
        modelBuilder.Entity<Hotel>(entity =>
        {
            entity.Property(e => e.PricePerNight).HasPrecision(10, 2);
            entity.Property(e => e.Rating).HasPrecision(3, 2);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.City).HasMaxLength(100);
            
            entity.HasOne(h => h.Manager)
                  .WithMany()
                  .HasForeignKey(h => h.ManagerId)
                  .IsRequired(false);
        });
        
        // Booking Configuration
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.Property(e => e.TotalAmount).HasPrecision(10, 2);
            entity.Property(e => e.GuestName).HasMaxLength(100);
            entity.Property(e => e.GuestEmail).HasMaxLength(255);
            entity.Property(e => e.Status).HasConversion<int>();
            
            entity.HasOne(b => b.Hotel)
                  .WithMany(h => h.Bookings)
                  .HasForeignKey(b => b.HotelId);
                  
            entity.HasOne(b => b.User)
                  .WithMany(u => u.Bookings)
                  .HasForeignKey(b => b.UserId)
                  .IsRequired(false);
        });
        
        // Payment Configuration
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.Property(e => e.Amount).HasPrecision(10, 2);
            entity.Property(e => e.Currency).HasMaxLength(3).HasDefaultValue("USD");
            entity.Property(e => e.PaymentMethod).HasConversion<int>();
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.TransactionId).HasMaxLength(50);
            
            entity.HasOne(p => p.Booking)
                  .WithMany()
                  .HasForeignKey(p => p.BookingId);
        });
        
        // Review Configuration
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasOne(r => r.User)
                  .WithMany(u => u.Reviews)
                  .HasForeignKey(r => r.UserId);
            entity.HasOne(r => r.Hotel)
                  .WithMany(h => h.Reviews)
                  .HasForeignKey(r => r.HotelId);
            entity.Property(r => r.Comment).HasMaxLength(1000);
        });
        
        // Loyalty Configuration
        modelBuilder.Entity<LoyaltyAccount>(entity =>
        {
            entity.HasOne(l => l.User)
                  .WithOne(u => u.LoyaltyAccount)
                  .HasForeignKey<LoyaltyAccount>(l => l.UserId);
        });
        
        // PointsTransaction Configuration
        modelBuilder.Entity<PointsTransaction>(entity =>
        {
            entity.Property(p => p.Description).HasMaxLength(500);
            
            entity.HasOne(p => p.LoyaltyAccount)
                  .WithMany(l => l.Transactions)
                  .HasForeignKey(p => p.LoyaltyAccountId);
                  
            entity.HasOne(p => p.Booking)
                  .WithMany()
                  .HasForeignKey(p => p.BookingId)
                  .IsRequired(false);
        });
        
        // HotelManagerApplication Configuration
        modelBuilder.Entity<HotelManagerApplication>(entity =>
        {
            entity.Property(a => a.BusinessName).HasMaxLength(200).IsRequired();
            entity.Property(a => a.BusinessAddress).HasMaxLength(500).IsRequired();
            entity.Property(a => a.BusinessLicense).HasMaxLength(100).IsRequired();
            entity.Property(a => a.ContactPerson).HasMaxLength(100).IsRequired();
            entity.Property(a => a.BusinessPhone).HasMaxLength(20).IsRequired();
            entity.Property(a => a.BusinessEmail).HasMaxLength(255).IsRequired();
            entity.Property(a => a.AdditionalInfo).HasMaxLength(1000);
            entity.Property(a => a.AdminNotes).HasMaxLength(1000);
            entity.Property(a => a.Status).HasConversion<int>();
            
            entity.HasOne(a => a.User)
                  .WithMany()
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(a => a.ProcessedByUser)
                  .WithMany()
                  .HasForeignKey(a => a.ProcessedBy)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Note: Sample data seeding is now handled by the DataSeeder service
        // This allows for more comprehensive and realistic test data
    }
}




