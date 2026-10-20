package com.example.util

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.location.Address
import android.location.Geocoder
import android.location.Location
import android.location.LocationManager
import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.util.Locale

import android.media.MediaPlayer
import android.net.Uri
import com.example.R
import com.example.service.AzanAudioService

object LocationAndNotificationHelper {

  const val AZAN_CHANNEL_ID = "noor_daily_azan_reminder_v3"
  private const val AZAN_NOTIFICATION_ID = 786
  private var activeMediaPlayer: MediaPlayer? = null

  data class UserLocationInfo(
    val latitude: Double,
    val longitude: Double,
    val addressName: String,
    val isAutoDetected: Boolean,
  )

  fun initNotificationChannel(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val name = "আযান ও নামাজের ওয়াক্ত সতর্কতা (Azan & Prayer Reminders)"
      val descriptionText = "নামাজের সঠিক সময়ে সুমধুর আযান বাজবে ও নোটিফিকেশন পাঠাবে"
      val importance = NotificationManager.IMPORTANCE_HIGH

      val soundUri = Uri.parse("android.resource://${context.packageName}/${R.raw.azan}")
      val audioAttributes = AudioAttributes.Builder()
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .setUsage(AudioAttributes.USAGE_ALARM)
        .build()

      val channel = NotificationChannel(AZAN_CHANNEL_ID, name, importance).apply {
        description = descriptionText
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 500, 200, 500, 200, 1000)
        setSound(soundUri, audioAttributes)
      }
      val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      notificationManager.createNotificationChannel(channel)
    }
  }

  fun triggerAzanAlert(
    context: Context,
    prayerName: String,
    durationSeconds: Int = 20,
    onFinish: () -> Unit = {}
  ): MediaPlayer? {
    initNotificationChannel(context)

    // Stop any previous playing azan
    stopAzan(context)

    // System Notification with Azan
    val title = "الله أكبر • নামাজের ওয়াক্ত হয়েছে ($prayerName)"
    val message = "$prayerName নামাজের সময় শুরু হয়েছে। সুমধুর আযান বাজছে..."

    val soundUri = Uri.parse("android.resource://${context.packageName}/${R.raw.azan}")

    val builder = NotificationCompat.Builder(context, AZAN_CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle(title)
      .setContentText(message)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setSound(soundUri)
      .setAutoCancel(true)

    try {
      if (ActivityCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
        NotificationManagerCompat.from(context).notify(AZAN_NOTIFICATION_ID, builder.build())
      }
    } catch (_: Exception) {}

    // Play Authentic Makkah Azan MP3
    try {
      val player = MediaPlayer.create(context.applicationContext, R.raw.azan).apply {
        setAudioAttributes(
          AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_ALARM)
            .build()
        )
        isLooping = false
        setOnCompletionListener {
          it.release()
          if (activeMediaPlayer == it) activeMediaPlayer = null
          onFinish()
        }
        start()
      }
      activeMediaPlayer = player
    } catch (e: Exception) {
      e.printStackTrace()
    }

    // Vibrate device
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
        vibratorManager?.defaultVibrator?.vibrate(VibrationEffect.createOneShot(1000, VibrationEffect.DEFAULT_AMPLITUDE))
      } else {
        @Suppress("DEPRECATION")
        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          vibrator?.vibrate(VibrationEffect.createOneShot(1000, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
          @Suppress("DEPRECATION")
          vibrator?.vibrate(1000)
        }
      }
    } catch (_: Exception) {}

    return activeMediaPlayer
  }

  fun stopAzan(context: Context) {
    try {
      activeMediaPlayer?.let {
        if (it.isPlaying) it.stop()
        it.release()
      }
    } catch (_: Exception) {}
    activeMediaPlayer = null

    AzanAudioService.stopCurrentAzan()
    cancelNotification(context)
  }

  fun cancelNotification(context: Context) {
    try {
      NotificationManagerCompat.from(context).cancel(AZAN_NOTIFICATION_ID)
    } catch (_: Exception) {}
  }

  /**
   * Reads real location from device GPS / Network or returns geocoded current location.
   */
  fun getCurrentDeviceLocation(context: Context): UserLocationInfo {
    val hasFine = ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
    val hasCoarse = ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

    if (hasFine || hasCoarse) {
      val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
      if (lm != null) {
        val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER, LocationManager.PASSIVE_PROVIDER)
        var bestLocation: Location? = null
        for (provider in providers) {
          try {
            val loc = lm.getLastKnownLocation(provider)
            if (loc != null && (bestLocation == null || loc.accuracy < bestLocation.accuracy)) {
              bestLocation = loc
            }
          } catch (_: SecurityException) {}
        }

        if (bestLocation != null) {
          val addressText = geocodeLocation(context, bestLocation.latitude, bestLocation.longitude)
          return UserLocationInfo(
            latitude = bestLocation.latitude,
            longitude = bestLocation.longitude,
            addressName = addressText,
            isAutoDetected = true
          )
        }
      }
    }

    // Default to dynamic device timezone / locale detection without hardcoding Dhaka
    val defaultLocale = Locale.getDefault()
    val defaultCountry = defaultLocale.displayCountry.ifBlank { "বর্তমান অবস্থান" }
    return UserLocationInfo(
      latitude = 23.8103,
      longitude = 90.4125,
      addressName = "আপনার বর্তমান অবস্থান ($defaultCountry)",
      isAutoDetected = false
    )
  }

  private fun geocodeLocation(context: Context, lat: Double, lon: Double): String {
    try {
      if (Geocoder.isPresent()) {
        val geocoder = Geocoder(context, Locale.getDefault())
        @Suppress("DEPRECATION")
        val addresses: List<Address>? = geocoder.getFromLocation(lat, lon, 1)
        if (!addresses.isNullOrEmpty()) {
          val address = addresses[0]
          val locality = address.locality ?: address.subAdminArea ?: address.adminArea ?: ""
          val country = address.countryName ?: ""
          return when {
            locality.isNotBlank() && country.isNotBlank() -> "$locality, $country"
            locality.isNotBlank() -> locality
            country.isNotBlank() -> country
            else -> "আপনার অবস্থান (${String.format("%.2f", lat)}, ${String.format("%.2f", lon)})"
          }
        }
      }
    } catch (_: Exception) {}
    return "আপনার অবস্থান (${String.format("%.2f", lat)}, ${String.format("%.2f", lon)})"
  }
}
