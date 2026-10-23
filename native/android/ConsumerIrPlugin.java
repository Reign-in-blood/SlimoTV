package com.reigninblood.slimotv;

import android.content.Context;
import android.hardware.ConsumerIrManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Copy into android/app/src/main/java/com/reigninblood/idualremote/ after cap add android. */
@CapacitorPlugin(name = "ConsumerIr")
public class ConsumerIrPlugin extends Plugin {
  private ConsumerIrManager manager() {
    return (ConsumerIrManager) getContext().getSystemService(Context.CONSUMER_IR_SERVICE);
  }

  @PluginMethod
  public void isAvailable(PluginCall call) {
    ConsumerIrManager ir = manager();
    JSObject result = new JSObject();
    result.put("available", ir != null && ir.hasIrEmitter());
    call.resolve(result);
  }

  @PluginMethod
  public void transmit(PluginCall call) {
    ConsumerIrManager ir = manager();
    if (ir == null || !ir.hasIrEmitter()) { call.reject("Émetteur IR indisponible."); return; }
    String code = call.getString("code");
    Integer hz = call.getInt("carrierFrequency", 38000);
    if (code == null || !code.matches("(?i)^0x[0-9a-f]{8}$") || hz == null || hz < 20000 || hz > 60000) {
      call.reject("Trame IR ou fréquence invalide."); return;
    }
    // Convention NEC classique: entête 9000/4500 µs, bits 560/560 ou 560/1690,
    // puis 560 µs final. The first physical-device test must confirm bit order.
    long value = Long.parseUnsignedLong(code.substring(2), 16);
    int[] pattern = new int[2 + 32 * 2 + 1];
    pattern[0] = 9000; pattern[1] = 4500;
    for (int bit = 0; bit < 32; bit++) {
      boolean one = (value & (1L << (31 - bit))) != 0;
      pattern[2 + bit * 2] = 560;
      pattern[3 + bit * 2] = one ? 1690 : 560;
    }
    pattern[66] = 560;
    try { ir.transmit(hz, pattern); call.resolve(); }
    catch (Exception exception) { call.reject("Échec émission IR", exception); }
  }
}
